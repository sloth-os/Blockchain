import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Focus, Layers3, List, RotateCcw, X } from "lucide-react";
import * as THREE from "three";
import { SourceLink } from "./components";
import { defaultNetwork, type Pattern, type Topology } from "./models";
import {
  fallbackPatternStory,
  peerStory,
  spatialObjectValue,
  type Point3,
  type SpatialObject,
  type SpatialStory,
} from "./spatial";

export type CameraMode = "follow" | "map" | "top";
export type SceneLens = "data" | "flow" | "trust";
interface Props {
  pattern?: Pattern;
  nodes?: number;
  topology?: Topology;
  color?: string;
  playing?: boolean;
  motion?: boolean;
  selected?: number | null;
  onSelect?: (node: number) => void;
  offline?: Set<number>;
  arrivals?: number[];
  progress?: number;
  className?: string;
  story?: SpatialStory;
  step?: number;
  phase?: number;
  speed?: number;
  cameraMode?: CameraMode;
  lens?: SceneLens;
  resetKey?: number;
  showLabels?: boolean;
  compact?: boolean;
  inspector?: boolean;
  blocked?: boolean;
  onObjectSelect?: (actor: SpatialObject) => void;
  focusArea?: string;
  selectedObjectId?: string | null;
  cameraFrame?: { target: Point3; distance: number; fit?: number };
  safeInsets?: {
    right: number;
    bottom: number;
    labelBottom?: number;
    intro?: { width: number; height: number };
  };
}
const vec = (p: Point3) => new THREE.Vector3(...p);
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** World-space objects + projected, accessible DOM labels share one semantic model. */
export default function Scene({
  pattern = "globe",
  nodes = 18,
  topology = "mesh",
  color,
  playing = true,
  motion,
  selected = null,
  onSelect,
  offline,
  arrivals,
  progress,
  className = "",
  story: provided,
  step = 0,
  phase,
  speed = 1,
  cameraMode,
  lens = "data",
  resetKey = 0,
  showLabels = true,
  compact = false,
  inspector = true,
  blocked = false,
  onObjectSelect,
  focusArea,
  selectedObjectId,
  cameraFrame,
  safeInsets,
}: Props) {
  const generated = useMemo(
    () =>
      pattern === "globe" || pattern === "mesh"
        ? peerStory({ ...defaultNetwork, nodes, topology })
        : fallbackPatternStory(pattern),
    [pattern, nodes, topology],
  );
  const story = useMemo(() => {
    const result = provided ?? generated;
    return color ? { ...result, color } : result;
  }, [provided, generated, color]);
  const [picked, setPicked] = useState<string | null>(null);
  const [list, setList] = useState(false);
  const [localReset, setLocalReset] = useState(0);
  const effectiveReset = resetKey + localReset;
  const [fallback, setFallback] = useState(false);
  const mount = useRef<HTMLDivElement>(null);
  const labels = useRef(new Map<string, HTMLButtonElement>());
  const flowLabels = useRef(new Map<number, HTMLSpanElement>());
  const dirty = useRef(true);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pose = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
    azimuth: number;
    polar: number;
    zoom: number;
    userOrbit: boolean;
  } | null>(null);
  const selectedId =
    selectedObjectId !== undefined
      ? selectedObjectId
      : story.network && selected !== null
        ? `n${selected}`
        : picked;
  const selectedObject = story.objects.find((o) => o.id === selectedId);
  const [localView, setLocalView] = useState<CameraMode>("map");
  const view = cameraMode ?? localView;
  const choose = (id: string) => {
    const actor = story.objects.find((o) => o.id === id);
    if (!actor) return;
    setPicked(id);
    setList(false);
    onObjectSelect?.(actor);
    if (story.network && id.startsWith("n")) onSelect?.(Number(id.slice(1)));
  };
  const motionAllowed = motion ?? playing;
  const latest = useRef({
    focusArea,
    cameraFrame,
    safeInsets,
    motionAllowed,
    story,
    step,
    phase,
    playing,
    speed,
    view,
    lens,
    selectedId,
    offline,
    arrivals,
    progress,
    showLabels,
    compact,
    blocked,
    choose,
    resetKey: effectiveReset,
  });
  useEffect(() => {
    latest.current = {
      focusArea,
      cameraFrame,
      safeInsets,
      motionAllowed,
      story,
      step,
      phase,
      playing,
      speed,
      view,
      lens,
      selectedId,
      offline,
      arrivals,
      progress,
      showLabels,
      compact,
      blocked,
      choose,
      resetKey: effectiveReset,
    };
    dirty.current = true;
  });
  useEffect(() => {
    setPicked(null);
    setList(false);
  }, [story.id]);
  useEffect(() => {
    setPicked((id) =>
      story.objects.find((o) => o.id === id)?.step === step ? id : null,
    );
  }, [step]);

  // Geometry lives until the semantic topology changes; live data never recreates a GPU context.
  const shapeKey =
    story.id +
    "|" +
    story.objects.map((o) => `${o.id}:${o.kind}`).join(",") +
    "|" +
    story.flows.map((f) => `${f.from}>${f.to}`).join(",");
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer =
        rendererRef.current ??
        new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
      rendererRef.current = renderer;
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.25 : 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    const canvas = renderer.domElement;
    if (canvas.parentElement !== host) host.appendChild(canvas);
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      `Interactive 3D ${story.title}. Drag or use arrow keys to orbit. Plus and minus zoom. Enter inspects an object.`,
    );
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#09131a", 0.022);
    const world = new THREE.Group();
    scene.add(world);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 350);
    const target = new THREE.Vector3(0, 0.5, 0),
      desiredTarget = target.clone();
    let azimuth = 0.16,
      polar = 0.92,
      zoom = 1,
      userOrbit = false,
      dragging = false,
      inView = true;
    if (pose.current) {
      camera.position.copy(pose.current.position);
      target.copy(pose.current.target);
      azimuth = pose.current.azimuth;
      polar = pose.current.polar;
      zoom = pose.current.zoom;
      userOrbit = pose.current.userOrbit;
    }
    let width = 1,
      height = 1,
      time = 0,
      last = performance.now(),
      lastRender = 0,
      frame = 0,
      hover: string | null = null;
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    scene.add(new THREE.HemisphereLight("#b8d4ef", "#18312c", 2.2));
    const key = new THREE.DirectionalLight("#def2ff", 4);
    key.position.set(-3, 8, 6);
    scene.add(key);
    const rim = new THREE.PointLight("#c4f568", 24, 25, 2);
    rim.position.set(1, 5, -3);
    scene.add(rim);
    const violet = new THREE.PointLight("#9c8dff", 20, 22, 2);
    violet.position.set(-5, 3, 2);
    scene.add(violet);

    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 64;
    const ctx = glowCanvas.getContext("2d")!;
    const radial = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radial.addColorStop(0, "rgba(255,255,255,.9)");
    radial.addColorStop(0.16, "rgba(255,255,255,.3)");
    radial.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glows: THREE.SpriteMaterial[] = [];
    function glow(parent: THREE.Object3D, tint: string, size: number) {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: tint,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      glows.push(material);
      const g = new THREE.Sprite(material);
      g.scale.setScalar(size);
      parent.add(g);
      return g;
    }
    function body(
      parent: THREE.Object3D,
      geometry: THREE.BufferGeometry,
      tint: string,
      opacity = 0.65,
    ) {
      const material = new THREE.MeshStandardMaterial({
        color: "#142b36",
        emissive: tint,
        emissiveIntensity: 0.2,
        metalness: 0.6,
        roughness: 0.25,
        transparent: true,
        opacity,
      });
      material.userData.baseOpacity = opacity;
      const mesh = new THREE.Mesh(geometry, material);
      parent.add(mesh);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 26),
        new THREE.LineBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.8,
        }),
      );
      mesh.add(edges);
      return mesh;
    }
    function bar(
      parent: THREE.Object3D,
      tint: string,
      w: number,
      y: number,
      z = 0.31,
    ) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.025, 0.025),
        new THREE.MeshBasicMaterial({ color: tint }),
      );
      m.position.set(-0.1, y, z);
      parent.add(m);
    }
    const actorGroups = new Map<
      string,
      {
        group: THREE.Group;
        glyph: THREE.Group;
        halo: THREE.Mesh;
        hit: THREE.Mesh;
        materials: THREE.MeshStandardMaterial[];
        base: THREE.Vector3;
        cells: THREE.Mesh[];
      }
    >();
    const pickable: THREE.Object3D[] = [];
    for (const actor of story.objects) {
      const tint = actor.color ?? story.color;
      const group = new THREE.Group();
      group.position.copy(vec(actor.position));
      world.add(group);
      const glyph = new THREE.Group();
      group.add(glyph);
      const cells: THREE.Mesh[] = [];
      if (actor.kind === "wallet" || actor.kind === "data") {
        const card = body(
          glyph,
          new THREE.BoxGeometry(actor.kind === "wallet" ? 1 : 0.78, 0.67, 0.14),
          tint,
        );
        card.rotation.y = -0.12;
        for (let i = 0; i < 4; i++)
          bar(glyph, tint, 0.52 - i * 0.06, 0.2 - i * 0.115, 0.1);
        if (actor.kind === "wallet") {
          const chip = body(
            glyph,
            new THREE.BoxGeometry(0.2, 0.16, 0.06),
            tint,
          );
          chip.position.set(0.28, 0.13, 0.14);
        } else
          for (let i = 1; i < 3; i++) {
            const layer = body(
              glyph,
              new THREE.BoxGeometry(0.78, 0.67, 0.05),
              tint,
              0.3,
            );
            layer.position.set(i * 0.06, -i * 0.05, -i * 0.13);
          }
      } else if (actor.kind === "key") {
        const ring = body(
          glyph,
          new THREE.TorusGeometry(0.24, 0.055, 8, 32),
          tint,
        );
        ring.position.y = 0.22;
        const stem = body(glyph, new THREE.BoxGeometry(0.09, 0.55, 0.09), tint);
        stem.position.y = -0.2;
        for (let i = 0; i < 2; i++) {
          const tooth = body(
            glyph,
            new THREE.BoxGeometry(0.2, 0.08, 0.09),
            tint,
          );
          tooth.position.set(0.06, -0.32 - i * 0.12, 0);
        }
      } else if (actor.kind === "peer") {
        body(
          glyph,
          new THREE.IcosahedronGeometry(story.network ? 0.12 : 0.22, 1),
          tint,
          0.8,
        );
        for (let i = 0; i < 2; i++) {
          const ring = body(
            glyph,
            new THREE.TorusGeometry(story.network ? 0.27 : 0.4, 0.009, 4, 40),
            tint,
            0.45,
          );
          ring.rotation.set((i * Math.PI) / 2, 0.4, 0);
        }
        glow(glyph, tint, story.network ? 1 : 1.4);
      } else if (actor.kind === "block") {
        body(glyph, new THREE.BoxGeometry(0.8, 0.8, 0.8), tint, 0.35);
        for (let i = 0; i < 8; i++) {
          const m = body(
            glyph,
            new THREE.BoxGeometry(0.15, 0.12, 0.15),
            tint,
            0.75,
          );
          m.position.set(
            ((i % 2) - 0.5) * 0.35,
            (Math.floor(i / 4) - 0.5) * 0.3,
            ((Math.floor(i / 2) % 2) - 0.5) * 0.35,
          );
          cells.push(m);
        }
      } else if (actor.kind === "proof") {
        body(glyph, new THREE.OctahedronGeometry(0.43), tint, 0.45);
        const ring = body(
          glyph,
          new THREE.TorusGeometry(0.58, 0.012, 5, 48),
          tint,
          0.7,
        );
        ring.rotation.x = Math.PI / 2;
        glow(glyph, tint, 1.9);
      } else if (actor.kind === "validator") {
        const chip = body(
          glyph,
          new THREE.CylinderGeometry(0.43, 0.43, 0.16, 6),
          tint,
        );
        chip.rotation.x = 0.2;
        const beacon = body(glyph, new THREE.OctahedronGeometry(0.22), tint);
        beacon.position.y = 0.4;
        for (let i = 0; i < 3; i++) {
          const pin = body(
            glyph,
            new THREE.BoxGeometry(0.05, 0.05, 0.16),
            tint,
          );
          pin.position.set(-0.25 + i * 0.25, -0.06, 0.45);
        }
      } else if (actor.kind === "vault") {
        body(glyph, new THREE.BoxGeometry(1.1, 0.85, 0.7), tint, 0.18);
        for (let i = 0; i < 20; i++) {
          const m = body(
            glyph,
            new THREE.BoxGeometry(0.17, 0.09, 0.18),
            tint,
            0.6,
          );
          m.position.set(
            ((i % 4) - 1.5) * 0.23,
            Math.floor(i / 8) * 0.2 - 0.27,
            ((Math.floor(i / 4) % 2) - 0.5) * 0.3,
          );
          cells.push(m);
        }
      } else if (actor.kind === "coin") {
        const coin = body(
          glyph,
          new THREE.CylinderGeometry(0.45, 0.45, 0.1, 48),
          tint,
          0.9,
        );
        coin.rotation.x = Math.PI / 2;
        const inset = body(
          glyph,
          new THREE.TorusGeometry(0.32, 0.012, 6, 40),
          tint,
          0.9,
        );
        inset.position.z = 0.062;
        bar(glyph, tint, 0.12, 0, 0.09);
        const stem = body(
          glyph,
          new THREE.BoxGeometry(0.025, 0.31, 0.025),
          tint,
        );
        stem.position.z = 0.1;
      } else if (actor.kind === "person") {
        const head = body(
          glyph,
          new THREE.SphereGeometry(0.18, 16, 12),
          tint,
          0.8,
        );
        head.position.y = 0.38;
        const torso = body(
          glyph,
          new THREE.CapsuleGeometry(0.18, 0.34, 4, 12),
          tint,
          0.55,
        );
        torso.position.y = -0.1;
      } else if (actor.kind === "shard") {
        for (
          let i = 0;
          i < ((actor.localId ?? actor.id).startsWith("leaf") ? 1 : 9);
          i++
        ) {
          const cell = body(
            glyph,
            new THREE.BoxGeometry(0.16, 0.07, 0.16),
            tint,
            0.7,
          );
          cell.position.set(
            ((i % 3) - 1) * 0.22,
            Math.sin(i) * 0.07,
            (Math.floor(i / 3) - 1) * 0.22,
          );
          cells.push(cell);
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const layer = body(
            glyph,
            new THREE.BoxGeometry(0.75, 0.15, 0.65),
            tint,
            0.55,
          );
          layer.position.y = i * 0.24 - 0.25;
        }
        for (let i = 0; i < 3; i++)
          bar(glyph, tint, 0.42 - i * 0.08, 0.2 - i * 0.15, 0.35);
      }
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(
          actor.kind === "peer" ? 0.35 : 0.7,
          0.01,
          4,
          64,
        ),
        new THREE.MeshBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.3,
        }),
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.52;
      group.add(halo);
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(actor.kind === "peer" ? 0.35 : 0.7, 48),
        new THREE.MeshBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.035,
          depthWrite: false,
        }),
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = -0.53;
      group.add(pad);
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 1.2, 0.8),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          colorWrite: false,
        }),
      );
      hit.userData.actor = actor.id;
      glyph.add(hit);
      pickable.push(hit);
      const materials: THREE.MeshStandardMaterial[] = [];
      glyph.traverse((o) => {
        if (
          o instanceof THREE.Mesh &&
          o.material instanceof THREE.MeshStandardMaterial
        )
          materials.push(o.material);
      });
      cells.forEach((cell) => {
        cell.userData.baseY = cell.position.y;
      });
      if (actor.portal)
        materials.forEach((material) => {
          material.fog = false;
        });
      actorGroups.set(actor.id, {
        group,
        glyph,
        halo,
        hit,
        materials,
        base: vec(actor.position),
        cells,
      });
    }
    type Path = {
      curve: THREE.CatmullRomCurve3;
      line: THREE.Line;
      packets: THREE.Group[];
      index: number;
    };
    const paths: Path[] = story.flows.map((flow, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(1, 0, 0),
      ]);
      const kind = flow.kind ?? "data";
      const tint =
        kind === "value"
          ? "#c4f568"
          : kind === "vote"
            ? "#b3a1ff"
            : kind === "proof"
              ? "#77dbea"
              : "#719ba7";
      const line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({
          color: tint,
          transparent: true,
          opacity: 0.24,
          dashSize: 0.12,
          gapSize: 0.07,
        }),
      );
      world.add(line);
      const packets = Array.from({ length: compact ? 2 : 3 }, () => {
        const g = new THREE.Group();
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 6),
          new THREE.MeshBasicMaterial({ color: tint }),
        );
        g.add(bead);
        glow(g, tint, 0.4);
        world.add(g);
        return g;
      });
      return { curve, line, packets, index };
    });
    const gridMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(story.color) },
      },
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;void main(){vec2 p=(vUv-.5)*55.;vec2 g=abs(fract(p-.5)-.5)/max(fwidth(p),vec2(.001));float grid=1.-min(min(g.x,g.y),1.);float fade=1.-smoothstep(4.,23.,length(p));float scan=exp(-pow((p.y-mod(uTime*.65,25.)+12.)*.7,2.));gl_FragColor=vec4(mix(vec3(.12,.21,.24),uColor,scan*.3),grid*fade*(.16+scan*.12));}",
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(55, 55), gridMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    scene.add(floor);
    const starArray = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      starArray[i * 3] = Math.sin(i * 127.1) * 24;
      starArray[i * 3 + 1] = 2 + Math.cos(i * 311.7) * 9;
      starArray[i * 3 + 2] = -4 - Math.abs(Math.sin(i * 7.3)) * 26;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starArray, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: "#a5c5d8",
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    scene.add(stars);

    const mapCenter = new THREE.Vector3();
    let smallLayout = false;
    const rebuildLayout = () => {
      smallLayout =
        latest.current.story.objects.length <= 4 && width / height < 1.2;
      const small: Point3[] = [
        [-1.6, 0.4, 1.6],
        [-1.6, 0.4, -1.6],
        [1.6, 0.4, 1.6],
        [1.6, 0.4, -1.6],
      ];
      const box = new THREE.Box3();
      latest.current.story.objects.forEach((actor, i) => {
        const node = actorGroups.get(actor.id);
        if (!node) return;
        node.base.copy(vec(smallLayout ? small[i] : actor.position));
        node.group.position.copy(node.base);
        box.expandByPoint(node.base);
      });
      box.getCenter(mapCenter);
      paths.forEach((path) => {
        const f = latest.current.story.flows[path.index],
          a = actorGroups.get(f.from)!.base,
          b = actorGroups.get(f.to)!.base;
        const middle = a.clone().lerp(b, 0.5);
        middle.y += f.arc ?? 0.45;
        path.curve.points = [a.clone(), middle, b.clone()];
        path.line.geometry.dispose();
        path.line.geometry = new THREE.BufferGeometry().setFromPoints(
          path.curve.getPoints(44),
        );
        path.line.computeLineDistances();
      });
    };
    const resize = () => {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rebuildLayout();
      dirty.current = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        dirty.current = true;
      },
      { rootMargin: "100px" },
    );
    intersection.observe(host);
    const cameraDestination = new THREE.Vector3();
    let viewRight = 0,
      viewBottom = 0;
    const setCamera = (dt: number, snap = false) => {
      const current = latest.current;
      const chapter =
        current.story.chapters[
          Math.min(current.step, current.story.chapters.length - 1)
        ];
      const pickedActor =
        current.selectedId && actorGroups.get(current.selectedId);
      if (current.cameraFrame)
        desiredTarget.copy(vec(current.cameraFrame.target));
      else if (current.view === "follow" && !current.story.network) {
        desiredTarget.copy(pickedActor ? pickedActor.base : vec(chapter.focus));
      } else desiredTarget.copy(mapCenter);
      const defaultDistance =
        (current.view === "follow" && !current.story.network
          ? pickedActor
            ? 6.6
            : 8.2
          : smallLayout
            ? 8.5
            : (current.story.mapDistance ?? 12)) *
        zoom *
        (current.view === "follow"
          ? Math.max(1, 0.95 / camera.aspect)
          : Math.max(
              1,
              (current.story.id === "protocol" ? 1.5 : 0.82) / camera.aspect,
            ));
      const logicalAspect = Math.max(
        0.3,
        (width - (current.safeInsets?.right ?? 0)) /
          (height - (current.safeInsets?.bottom ?? 0)),
      );
      const distance = current.cameraFrame
        ? current.cameraFrame.distance *
          zoom *
          Math.max(1, (current.cameraFrame.fit ?? 0.9) / logicalAspect)
        : defaultDistance;
      const projectionBlend =
        !current.motionAllowed || snap ? 1 : 1 - Math.exp(-dt * 7);
      viewRight +=
        ((current.safeInsets?.right ?? 0) - viewRight) * projectionBlend;
      viewBottom +=
        ((current.safeInsets?.bottom ?? 0) - viewBottom) * projectionBlend;
      camera.setViewOffset(
        width,
        height,
        viewRight * 0.5,
        viewBottom * 0.5,
        width,
        height,
      );
      const phi = current.view === "top" ? 0.12 : polar;
      cameraDestination
        .set(
          Math.sin(azimuth) * Math.sin(phi) * distance,
          Math.cos(phi) * distance,
          Math.cos(azimuth) * Math.sin(phi) * distance,
        )
        .add(desiredTarget);
      const blend =
        snap || !current.motionAllowed ? 1 : 1 - Math.exp(-dt * 3.4);
      target.lerp(desiredTarget, blend);
      camera.position.lerp(cameraDestination, blend);
      camera.lookAt(target);
      return (
        Math.abs((current.safeInsets?.right ?? 0) - viewRight) > 0.3 ||
        Math.abs((current.safeInsets?.bottom ?? 0) - viewBottom) > 0.3 ||
        camera.position.distanceToSquared(cameraDestination) > 0.0001 ||
        target.distanceToSquared(desiredTarget) > 0.0001
      );
    };
    setCamera(0.016, !pose.current);
    let px = 0,
      py = 0,
      travel = 0,
      velocityX = 0,
      velocityY = 0;
    const touches = new Map<number, { x: number; y: number }>();
    let pinching = false,
      pinchDistance = 1,
      pinchZoom = 1;
    const hitAt = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - box.left) / width) * 2 - 1,
        (-(event.clientY - box.top) / height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const visible = pickable.filter(
        (mesh) =>
          !latest.current.story.objects.find(
            (actor) => actor.id === mesh.userData.actor,
          )?.portal || latest.current.focusArea === "atlas",
      );
      return raycaster.intersectObjects(visible, false)[0]?.object.userData
        .actor as string | undefined;
    };
    const pointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) {
          const [a, b] = [...touches.values()];
          pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
          pinchZoom = zoom;
          pinching = true;
          dragging = false;
          canvas.setPointerCapture(e.pointerId);
          return;
        }
      }
      dragging = true;
      travel = 0;
      px = e.clientX;
      py = e.clientY;
      velocityX = velocityY = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e: PointerEvent) => {
      if (touches.has(e.pointerId)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size >= 2) {
          const [a, b] = [...touches.values()];
          zoom = clamp(
            (pinchZoom * pinchDistance) /
              Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
            0.62,
            1.9,
          );
          userOrbit = true;
          dirty.current = true;
          return;
        }
      }
      if (dragging) {
        const dx = e.clientX - px,
          dy = e.clientY - py;
        travel += Math.abs(dx) + Math.abs(dy);
        velocityX = -dx * 0.004;
        velocityY = -dy * 0.003;
        azimuth += velocityX;
        polar = clamp(polar + velocityY, 0.2, 1.45);
        userOrbit = true;
        px = e.clientX;
        py = e.clientY;
        dirty.current = true;
      } else {
        const next = hitAt(e) ?? null;
        if (next !== hover) {
          hover = next;
          canvas.style.cursor = hover ? "pointer" : "grab";
          dirty.current = true;
        }
      }
    };
    const pointerUp = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (pinching) {
        if (!touches.size) pinching = false;
        dragging = false;
        return;
      }
      if (dragging && travel < 7) {
        const id = hitAt(e);
        if (id) latest.current.choose(id);
      }
      dragging = false;
    };
    const pointerCancel = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (!touches.size) pinching = false;
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      if (document.activeElement !== canvas) return;
      e.preventDefault();
      zoom = clamp(zoom + e.deltaY * 0.001, 0.62, 1.9);
      userOrbit = true;
      dirty.current = true;
    };
    const keyboard = (e: KeyboardEvent) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "-",
          "=",
          "Enter",
          "Home",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      if (e.key === "ArrowLeft") azimuth -= 0.12;
      if (e.key === "ArrowRight") azimuth += 0.12;
      if (e.key === "ArrowUp") polar = clamp(polar - 0.1, 0.2, 1.45);
      if (e.key === "ArrowDown") polar = clamp(polar + 0.1, 0.2, 1.45);
      if (e.key === "+" || e.key === "=") zoom = clamp(zoom - 0.1, 0.62, 1.9);
      if (e.key === "-") zoom = clamp(zoom + 0.1, 0.62, 1.9);
      if (e.key === "Home") {
        azimuth = 0.16;
        polar = 0.92;
        zoom = 1;
        userOrbit = false;
      }
      if (e.key === "Enter") {
        const items = latest.current.story.objects;
        const i = items.findIndex((a) => a.id === latest.current.selectedId);
        latest.current.choose(items[(i + 1) % items.length].id);
      }
      dirty.current = true;
    };
    const contextLost = (e: Event) => {
      e.preventDefault();
      setFallback(true);
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerCancel);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("keydown", keyboard);
    canvas.addEventListener("webglcontextlost", contextLost);
    let previousStep = step,
      previousReset = resetKey;
    let previousFocus = focusArea;
    let phaseTime = 0;
    const projected = new THREE.Vector3();
    const occupied: { x: number; y: number; w: number; h: number }[] = [];
    const positionLabels = () => {
      occupied.length = 0;
      const current = latest.current;
      const important = [
        "root",
        "block",
        "verify",
        "wallet",
        "signed",
        "recipient",
      ];
      const rank = (actor: SpatialObject) =>
        actor.id === current.selectedId
          ? -1000
          : actor.portal && current.focusArea === "atlas"
            ? -900
            : actor.step === current.step
              ? -100 -
                (important.includes(actor.localId ?? actor.id)
                  ? 20 - important.indexOf(actor.localId ?? actor.id)
                  : 0)
              : actor.secondary
                ? 10
                : 0;
      const ranked = [...current.story.objects].sort(
        (a, b) => rank(a) - rank(b),
      );
      let shown = 0;
      const maxLabels =
        current.focusArea === "atlas"
          ? 5
          : current.compact
            ? 3
            : width < 500
              ? 5
              : 10;
      for (const actor of ranked) {
        const el = labels.current.get(actor.id),
          node = actorGroups.get(actor.id);
        if (!el || !node) continue;
        const chosen = actor.id === current.selectedId;
        projected
          .copy(node.group.position)
          .add(new THREE.Vector3(0, actor.kind === "peer" ? 0.42 : 0.75, 0))
          .project(camera);
        const x = (projected.x * 0.5 + 0.5) * width,
          y = (-projected.y * 0.5 + 0.5) * height;
        const w = el.offsetWidth || (current.compact ? 110 : 166),
          h = el.offsetHeight || (current.compact ? 37 : 49);
        const offsets = current.compact
          ? [
              [0, 0],
              [-25, -40],
              [25, 40],
            ]
          : [
              [0, 0],
              [-60, -42],
              [60, -42],
              [0, -85],
              [-65, 35],
              [65, 35],
              [0, 65],
              ...(actor.portal
                ? [
                    [0, 110],
                    [-80, 110],
                    [80, 110],
                    [0, 165],
                  ]
                : []),
            ];
        const reservedBottom =
          current.story.id === "protocol" ? 85 : current.compact ? 25 : 38;
        // Small screens retain five anchored landmarks in readable rows.
        // Leader lines still connect each label to its world-space object.
        if (
          actor.portal &&
          current.focusArea === "atlas" &&
          (width < 700 || height < 600)
        ) {
          const landscape = width >= 700;
          const layout: Record<string, [number, number]> = landscape
            ? {
                transaction: [0.18, 1],
                network: [0.5, 1],
                scale: [0.82, 1],
                applications: [0.68, 0],
                topics: [0.32, 0],
              }
            : {
                transaction: [0.5, 2],
                network: [0.25, 1],
                scale: [0.75, 1],
                applications: [0.75, 0],
                topics: [0.25, 0],
              };
          const [column, row] = layout[actor.area ?? "transaction"];
          const top = current.safeInsets?.intro?.height ?? 150;
          const spacing = landscape
            ? h + 8
            : Math.max(
                h + 10,
                Math.min(
                  100,
                  (height -
                    top -
                    (current.safeInsets?.labelBottom ?? 100) -
                    h -
                    24) /
                    2,
                ),
              );
          offsets.unshift([
            clamp(width * column, w / 2 + 12, width - w / 2 - 12) - x,
            top + h + (landscape ? 8 : 16) + row * spacing - y,
          ]);
        }
        const candidate = offsets
          .map(([dx, dy]) => ({ x: x + dx, y: y + dy, dx, dy }))
          .find((p) => {
            if (
              p.x < w / 2 + 7 ||
              p.x > width - (current.safeInsets?.right ?? 0) - w / 2 - 7 ||
              p.y - h < (height < 350 ? 8 : 45) ||
              (current.safeInsets?.intro &&
                p.x - w / 2 < current.safeInsets.intro.width &&
                p.y - h < current.safeInsets.intro.height) ||
              p.y >
                height -
                  Math.max(
                    reservedBottom,
                    current.safeInsets?.bottom ?? 0,
                    current.safeInsets?.labelBottom ?? 0,
                  )
            )
              return false;
            return !occupied.some(
              (q) =>
                Math.abs(q.x - p.x) < (q.w + w) / 2 + 8 &&
                Math.abs(q.y - (p.y - h / 2)) < (q.h + h) / 2 + 7,
            );
          });
        const hidden =
          !current.showLabels ||
          (current.focusArea
            ? current.focusArea === "atlas"
              ? !actor.portal
              : actor.portal ||
                (actor.area !== current.focusArea &&
                  !(
                    current.focusArea === "transaction" &&
                    current.step === 2 &&
                    actor.area === "network"
                  ))
            : false) ||
          projected.z > 1 ||
          projected.z < 0 ||
          !candidate ||
          (!chosen &&
            (shown >= maxLabels ||
              (actor.secondary &&
                !current.story.network &&
                actor.area !== "network") ||
              (current.view === "follow" &&
                !current.story.network &&
                Math.abs(actor.step - current.step) > 1 &&
                !actor.portal &&
                !(
                  current.focusArea === "transaction" &&
                  current.step === 2 &&
                  actor.area === "network"
                ))));
        const placed = candidate ?? { x, y, dx: 0, dy: 0 };
        el.style.visibility = hidden ? "hidden" : "visible";
        el.style.transform = `translate3d(${placed.x}px,${placed.y}px,0) translate(-50%,-100%)`;
        el.style.zIndex = chosen
          ? "6"
          : actor.step === current.step
            ? "4"
            : "3";
        if (!hidden) {
          const end = node.group.position.clone().project(camera);
          const endX = (end.x * 0.5 + 0.5) * width,
            endY = (-end.y * 0.5 + 0.5) * height;
          const dx = endX - placed.x,
            dy = endY - placed.y;
          el.style.setProperty("--leader-length", `${Math.hypot(dx, dy)}px`);
          el.style.setProperty(
            "--leader-angle",
            `${Math.atan2(dy, dx) - Math.PI / 2}rad`,
          );
          occupied.push({ x: placed.x, y: placed.y - h / 2, w, h });
          shown++;
        }
      }
      let flowLabelsShown = 0;
      paths.forEach((path) => {
        const el = flowLabels.current.get(path.index);
        if (!el) return;
        const flow = current.story.flows[path.index];
        projected.copy(path.curve.getPoint(0.5)).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width,
          y = (-projected.y * 0.5 + 0.5) * height;
        const overlap = occupied.some(
          (p) =>
            Math.abs(p.x - x) < (p.w + 130) / 2 &&
            Math.abs(p.y - y) < (p.h + 20) / 2,
        );
        el.style.visibility =
          !current.showLabels ||
          current.lens === "trust" ||
          current.compact ||
          (!!flow.networkEdge &&
            (current.selectedId
              ? flow.from !== current.selectedId &&
                flow.to !== current.selectedId
              : flowLabelsShown >= 4)) ||
          (current.lens !== "flow" &&
            (current.story.network || flow.networkEdge)) ||
          (!(
            flow.trace &&
            current.focusArea === "transaction" &&
            current.step === 2
          ) &&
            (flow.step !== current.step ||
              (current.focusArea && flow.area !== current.focusArea))) ||
          flow.relation ||
          overlap ||
          x < 75 ||
          x > width - 75 ||
          y < 30 ||
          y > height - 30 ||
          projected.z > 1
            ? "hidden"
            : "visible";
        if (el.style.visibility === "visible" && flow.networkEdge)
          flowLabelsShown++;
        el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      });
    };
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (now - lastRender < 1000 / 30) return;
      const dt = clamp((now - last) / 1000, 0, 0.06);
      last = now;
      lastRender = now;
      const current = latest.current;
      const active = current.playing && inView && !document.hidden;
      if (!inView || document.hidden) return;
      if (current.focusArea !== previousFocus) {
        previousFocus = current.focusArea;
        phaseTime = 0;
        dirty.current = true;
      }
      if (current.step !== previousStep) {
        previousStep = current.step;
        phaseTime = 0;
        if (!userOrbit) {
          azimuth = 0.16;
          polar = 0.92;
        }
        dirty.current = true;
      }
      if (previousReset !== current.resetKey) {
        previousReset = current.resetKey;
        azimuth = 0.16;
        polar = 0.92;
        zoom = 1;
        userOrbit = false;
        dirty.current = true;
      }
      const inertial =
        active &&
        !dragging &&
        Math.abs(velocityX) + Math.abs(velocityY) > 0.0001;
      if (inertial) {
        azimuth += velocityX * 0.6;
        polar = clamp(polar + velocityY * 0.6, 0.2, 1.45);
        velocityX *= 0.86;
        velocityY *= 0.86;
      }
      const moving = setCamera(dt);
      if (!active && !dirty.current && !moving && !dragging && !inertial)
        return;
      if (active) {
        time += dt * current.speed;
        phaseTime += dt * current.speed;
      }
      gridMaterial.uniforms.uTime.value = time;
      gridMaterial.uniforms.uColor.value.set(current.story.color);
      stars.rotation.y = Math.sin(time * 0.025) * 0.015;
      for (const actor of current.story.objects) {
        const item = actorGroups.get(actor.id);
        if (!item) continue;
        item.group.visible = !actor.portal || current.focusArea === "atlas";
        const index =
          actor.networkIndex ??
          (current.story.network ? Number(actor.id.slice(1)) : -1);
        const isPeer = index >= 0;
        const sameArea =
          !current.focusArea ||
          actor.area === current.focusArea ||
          (current.focusArea === "transaction" && current.step === 2 && isPeer);
        const isOffline = isPeer
          ? (current.offline?.has(index) ?? actor.offline)
          : actor.offline;
        const arrival = current.arrivals?.[index] ?? actor.arrival ?? 0;
        const reached =
          !isPeer ||
          current.progress === undefined ||
          arrival <= current.progress;
        const isActive = actor.portal
            ? current.focusArea === "atlas"
            : sameArea &&
              (actor.step === current.step ||
                (current.focusArea === "transaction" &&
                  current.step === 2 &&
                  isPeer)),
          chosen = actor.id === current.selectedId || actor.id === hover;
        const isBlocked =
          current.blocked &&
          (!actor.area || actor.area === "transaction") &&
          actor.step > 3;
        const tint = isOffline
          ? "#47525d"
          : current.blocked && (actor.localId ?? actor.id) === "verify"
            ? "#f59291"
            : (actor.color ?? current.story.color);
        item.group.position.copy(item.base);
        item.glyph.position.y =
          Math.sin(time * 0.9 + actor.position[0]) * 0.045;
        item.glyph.rotation.y =
          actor.kind === "proof"
            ? time * 0.12
            : actor.kind === "coin"
              ? Math.sin(time * 0.45) * 0.28
              : 0;
        const scale = chosen ? 1.12 : 1;
        item.glyph.scale.lerp(
          new THREE.Vector3(scale, scale, scale),
          current.playing ? 0.15 : 1,
        );
        item.materials.forEach((m) => {
          m.emissive.set(tint);
          m.emissiveIntensity =
            isOffline || isBlocked
              ? 0.015
              : chosen
                ? 0.65
                : isActive && reached
                  ? 0.32
                  : 0.08;
          m.opacity =
            (m.userData.baseOpacity ?? 1) *
            (isOffline || isBlocked
              ? 0.2
              : isActive || chosen
                ? 0.96
                : current.focusArea === "atlas"
                  ? 0.65
                  : sameArea
                    ? 0.45
                    : 0.16);
        });
        item.glyph.traverse((child) => {
          if (child instanceof THREE.Sprite) {
            child.material.color.set(tint);
            child.material.opacity =
              isOffline || isBlocked ? 0 : isActive && reached ? 0.55 : 0.06;
          }
          if (
            child instanceof THREE.LineSegments &&
            child.material instanceof THREE.LineBasicMaterial
          ) {
            child.material.color.set(tint);
            child.material.opacity =
              isOffline || isBlocked
                ? 0.12
                : isActive && reached
                  ? 0.85
                  : sameArea
                    ? 0.34
                    : current.focusArea === "atlas"
                      ? 0.5
                      : 0.1;
          }
        });
        (item.halo.material as THREE.MeshBasicMaterial).color.set(tint);
        (item.halo.material as THREE.MeshBasicMaterial).opacity =
          isOffline || isBlocked
            ? 0.08
            : chosen
              ? 0.8
              : isActive && reached
                ? 0.45
                : 0.13;
        item.halo.scale.setScalar(
          isActive && reached
            ? 1 + Math.sin(time * 1.6 + actor.step) * 0.08
            : 1,
        );
        item.cells.forEach((cell, i) => {
          const value = actor.fill ?? 1;
          cell.visible = i / item.cells.length < value;
          cell.position.y =
            (cell.userData.baseY ?? 0) + Math.sin(time * 1.4 + i * 0.3) * 0.025;
        });
      }
      paths.forEach((path) => {
        const flow = current.story.flows[path.index];
        const activeFlow =
          ((flow.step === current.step &&
            (!current.focusArea || flow.area === current.focusArea)) ||
            (!!flow.trace &&
              current.focusArea === "transaction" &&
              current.step === 2)) &&
          !flow.relation &&
          !(
            current.blocked &&
            (!flow.area || flow.area === "transaction") &&
            flow.step > 3
          );
        const a = actorGroups.get(flow.from),
          b = actorGroups.get(flow.to);
        if (!a || !b) return;
        let amount = current.phase ?? (phaseTime * 0.5 * (flow.rate ?? 1)) % 1;
        let visible = activeFlow;
        if (flow.window && !current.story.network) {
          const [from, to] = flow.window;
          visible = visible && amount >= from && amount <= to;
          amount = clamp((amount - from) / (to - from), 0, 1);
        }

        const [aIndex, bIndex] = flow.networkEdge ?? [
          Number(flow.from.slice(1)),
          Number(flow.to.slice(1)),
        ];
        if (
          (flow.networkEdge || current.story.network) &&
          current.progress !== undefined
        ) {
          const at = current.arrivals?.[aIndex] ?? 0,
            bt = current.arrivals?.[bIndex] ?? 0;
          const first = Math.min(at, bt),
            end = Math.max(at, bt);
          visible =
            activeFlow &&
            Number.isFinite(end) &&
            end > first &&
            current.progress >= first &&
            current.progress <= end &&
            !current.offline?.has(aIndex) &&
            !current.offline?.has(bIndex);
          amount = clamp(
            (current.progress - first) / Math.max(1, end - first),
            0,
            1,
          );
          if (at > bt) amount = 1 - amount;
        }
        const material = path.line.material as THREE.LineDashedMaterial;
        const failedEdge =
          (flow.networkEdge || current.story.network) &&
          (current.offline?.has(aIndex) || current.offline?.has(bIndex));
        material.opacity = failedEdge
          ? 0.035
          : activeFlow
            ? current.lens === "flow"
              ? 0.85
              : 0.6
            : flow.step < current.step
              ? 0.24
              : current.view === "map"
                ? 0.14
                : 0.05;
        if (
          current.blocked &&
          (flow.to === "verify" || flow.to === "tx:verify")
        )
          material.color.set("#f59291");
        path.packets.forEach((packet, i) => {
          const t = amount - i * 0.033;
          packet.visible = visible && t >= 0 && t <= 1;
          if (packet.visible) {
            packet.position.copy(path.curve.getPoint(clamp(t, 0, 1)));
            packet.scale.setScalar(1 - i * 0.2);
          }
        });
      });
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      positionLabels();
      renderer.render(scene, camera);
      dirty.current = false;
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerCancel);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", contextLost);
      scene.traverse((o) => {
        const obj = o as THREE.Mesh;
        obj.geometry?.dispose();
        if (obj.material)
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
            (m) => m.dispose(),
          );
      });
      glowTexture.dispose();
      pose.current = {
        position: camera.position.clone(),
        target: target.clone(),
        azimuth,
        polar,
        zoom,
        userOrbit,
      };
    };
    // Topology, not narration or live metrics, determines geometry lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  useEffect(
    () => () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        rendererRef.current = null;
      }
    },
    [],
  );

  // Resetting should be an explicit camera command without rebuilding the scene.
  useEffect(() => {
    dirty.current = true;
  }, [resetKey]);
  const chapter = story.chapters[Math.min(step, story.chapters.length - 1)];
  const displayObjects = story.objects.filter(
    (actor) =>
      !focusArea ||
      actor.portal ||
      actor.area === focusArea ||
      (focusArea === "transaction" && step === 2 && actor.area === "network"),
  );
  return (
    <div
      data-focus={focusArea}
      className={`scene spatial-scene ${compact ? "spatial-compact" : ""} ${fallback ? "spatial-fallback" : ""} ${className}`}
      data-scene={story.id}
      data-step={step}
    >
      <div
        className="scene-mount"
        ref={mount}
        aria-hidden={fallback || undefined}
      />
      <div className="world-atmosphere" aria-hidden="true" />
      {fallback ? (
        <div className="spatial-fallback-objects">
          {displayObjects
            .filter(
              (a) =>
                !a.secondary || story.network || a.networkIndex !== undefined,
            )
            .map((actor) => (
              <button
                key={actor.id}
                onClick={() => choose(actor.id)}
                style={
                  {
                    "--object-color": actor.color ?? story.color,
                  } as React.CSSProperties
                }
              >
                <span className="fallback-object-glyph">
                  {actor.kind === "coin"
                    ? "◉"
                    : actor.kind === "peer"
                      ? "⊙"
                      : "◇"}
                </span>
                <strong>{actor.label}</strong>
                <span>
                  {spatialObjectValue(
                    actor,
                    !!story.network || actor.networkIndex !== undefined,
                    progress,
                  )}
                </span>
              </button>
            ))}
          <span className="compatibility">
            2D compatibility view · WebGL unavailable
          </span>
        </div>
      ) : (
        <div
          className="world-labels"
          aria-label="Objects in the 3D explanation"
        >
          {displayObjects.map((actor) => (
            <button
              key={actor.id}
              data-object-id={actor.id}
              ref={(el) => {
                if (el) labels.current.set(actor.id, el);
                else labels.current.delete(actor.id);
              }}
              className={`world-label ${actor.portal ? "portal-label" : ""} ${actor.step === step ? "current" : ""} ${selectedId === actor.id ? "selected" : ""} ${actor.offline ? "offline" : ""}`}
              style={
                {
                  "--object-color": actor.color ?? story.color,
                } as React.CSSProperties
              }
              onClick={() => choose(actor.id)}
              aria-label={
                actor.portal
                  ? `Explore ${actor.label}`
                  : `Inspect ${actor.label}: ${spatialObjectValue(actor, !!story.network || actor.networkIndex !== undefined, progress)}`
              }
            >
              <span className="world-label-title">
                <i />
                {actor.label}
              </span>
              <strong>
                {actor.portal
                  ? actor.value
                  : lens === "trust"
                    ? {
                        wallet: "Who controls the key?",
                        key: "How is authority protected?",
                        data: "Who attests to the inputs?",
                        peer: "Can this peer deliver?",
                        block: "Which rules were checked?",
                        proof: "What does the proof assume?",
                        vault: "Who controls the assets?",
                        coin: "What backs this claim?",
                        contract: "Who can change the code?",
                        validator: "Which quorum decides?",
                        shard: "Can the data be recovered?",
                        person: "Who can participate?",
                      }[actor.kind]
                    : lens === "flow" && actor.networkIndex === undefined
                      ? (story.flows.find(
                          (f) =>
                            f.step === step &&
                            (f.from === actor.id || f.to === actor.id),
                        )?.label ??
                        spatialObjectValue(
                          actor,
                          !!story.network || actor.networkIndex !== undefined,
                          progress,
                        ))
                      : spatialObjectValue(
                          actor,
                          !!story.network || actor.networkIndex !== undefined,
                          progress,
                        )}
              </strong>
              {lens === "trust" && !actor.portal && (
                <span className="world-label-trust">{actor.trust}</span>
              )}
            </button>
          ))}
          {story.flows.map((flow, i) => (
            <span
              key={`${flow.from}-${flow.to}`}
              ref={(el) => {
                if (el) flowLabels.current.set(i, el);
                else flowLabels.current.delete(i);
              }}
              className={`world-flow-label ${flow.kind ?? "data"}`}
            >
              {flow.kind === "proof"
                ? "PROOF"
                : flow.kind === "value"
                  ? "VALUE"
                  : flow.kind === "vote"
                    ? "VOTE"
                    : "DATA"}
              <ChevronRight size={9} />
              {flow.label}
            </span>
          ))}
        </div>
      )}
      <div className="world-tools">
        <button
          aria-label="Reset scene camera"
          title="Reset camera · Home"
          onClick={() => setLocalReset((v) => v + 1)}
        >
          <RotateCcw size={13} />
        </button>
        <button
          className={list ? "active" : ""}
          aria-label="Browse scene objects"
          aria-expanded={list}
          onClick={() => setList((v) => !v)}
        >
          <List size={14} />
          <span>Objects</span>
          <small>{displayObjects.length}</small>
        </button>
        {!cameraMode && (
          <button
            aria-label="Change scene camera"
            onClick={() => setLocalView((v) => (v === "map" ? "top" : "map"))}
          >
            <Focus size={14} />
            <span>{localView === "top" ? "Top view" : "Orbit view"}</span>
          </button>
        )}
      </div>
      {list && (
        <div className="world-object-list">
          <div>
            EVERY OBJECT IS EXPLAINABLE
            <button
              aria-label="Close object list"
              onClick={() => setList(false)}
            >
              <X size={13} />
            </button>
          </div>
          {displayObjects.map((actor) => (
            <button key={actor.id} onClick={() => choose(actor.id)}>
              <span style={{ background: actor.color ?? story.color }} />
              <strong>{actor.label}</strong>
              <small>{actor.value}</small>
              <ChevronRight size={12} />
            </button>
          ))}
        </div>
      )}
      {inspector && selectedObject && picked && (
        <aside className="object-inspector" aria-label="3D object inspector">
          <div className="object-inspector-header">
            <span>
              <Layers3 size={12} />
              OBJECT INSPECTOR
            </span>
            <button
              aria-label="Close object inspector"
              onClick={() => {
                setPicked(null);
                mount.current?.querySelector("canvas")?.focus();
              }}
            >
              <X size={14} />
            </button>
          </div>
          <h3>{selectedObject.label}</h3>
          <strong style={{ color: selectedObject.color ?? story.color }}>
            {spatialObjectValue(
              selectedObject,
              !!story.network || selectedObject.networkIndex !== undefined,
              progress,
            )}
          </strong>
          <p>{selectedObject.detail}</p>
          <dl>
            {selectedObject.facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="object-trust">
            <span>TRUST BOUNDARY</span>
            <p>{selectedObject.trust}</p>
          </div>
          <SourceLink
            id={
              story.chapters[
                Math.min(selectedObject.step, story.chapters.length - 1)
              ]?.source ?? chapter.source
            }
          />
        </aside>
      )}
      <span className="world-navigation-hint">
        <RotateCcw size={10} />
        Drag to orbit<span>·</span>Arrow keys<span>·</span>+/− zoom
        <span>·</span>Select to inspect
      </span>
    </div>
  );
}
