import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { networkEdges, type Pattern, type Topology } from "./models";

interface Props {
  pattern?: Pattern;
  nodes?: number;
  topology?: Topology;
  color?: string;
  playing?: boolean;
  selected?: number | null;
  onSelect?: (node: number) => void;
  offline?: Set<number>;
  arrivals?: number[];
  progress?: number;
  className?: string;
}
const LIME = "#c4f568";
const VIOLET = "#a49aef";

/** A single renderer per view, with explicit geometry, event and context cleanup. */
export default function Scene({
  pattern = "globe",
  nodes = 18,
  topology = "mesh",
  color = LIME,
  playing = true,
  selected = null,
  onSelect,
  offline,
  arrivals,
  progress,
  className = "",
}: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const latest = useRef({
    playing,
    selected,
    onSelect,
    offline,
    arrivals,
    progress,
  });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    latest.current = {
      playing,
      selected,
      onSelect,
      offline,
      arrivals,
      progress,
    };
  }, [playing, selected, onSelect, offline, arrivals, progress]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      `Interactive 3D ${pattern} illustration. Arrow keys rotate, plus and minus zoom${onSelect ? ", Enter selects a node" : ""}.`,
    );
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#0c141a", 0.035);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
    let zoom = 10.7;
    camera.position.set(0, 3, zoom);
    camera.lookAt(0, -0.15, 0);
    const world = new THREE.Group();
    world.rotation.y = -0.28;
    scene.add(world);
    scene.add(new THREE.AmbientLight("#b7d4e6", 1.5));
    const key = new THREE.DirectionalLight("#dce8ff", 3);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.PointLight(color, 12, 18);
    fill.position.set(-3, 2, 2);
    scene.add(fill);

    const grid = new THREE.GridHelper(24, 48, "#29413c", "#1b2d30");
    grid.position.y = -2.65;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.32;
    scene.add(grid);

    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 64;
    const ctx = glowCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.15, "rgba(255,255,255,.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(glowCanvas);
    function glow(
      parent: THREE.Object3D,
      tint: THREE.ColorRepresentation,
      scale = 0.65,
    ) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          color: tint,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sprite.scale.setScalar(scale);
      parent.add(sprite);
      return sprite;
    }
    function line(
      points: THREE.Vector3[],
      tint: THREE.ColorRepresentation,
      opacity = 0.3,
      parent: THREE.Object3D = world,
    ) {
      const object = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: tint,
          transparent: true,
          opacity,
          depthWrite: false,
        }),
      );
      parent.add(object);
      return object;
    }
    function cube(
      size: number,
      tint: THREE.ColorRepresentation,
      position: THREE.Vector3,
      parent: THREE.Object3D = world,
    ) {
      const group = new THREE.Group();
      const geometry = new THREE.BoxGeometry(size, size, size);
      const box = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: "#142026",
          emissive: tint,
          emissiveIntensity: 0.1,
          metalness: 0.65,
          roughness: 0.3,
          transparent: true,
          opacity: 0.8,
        }),
      );
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.85,
        }),
      );
      group.add(box, edge);
      group.position.copy(position);
      parent.add(group);
      return group;
    }
    function ring(
      radius: number,
      rotation: THREE.Euler,
      tint: THREE.ColorRepresentation,
      opacity = 0.3,
    ) {
      const points = Array.from(
        { length: 101 },
        (_, i) =>
          new THREE.Vector3(
            Math.cos((i / 100) * Math.PI * 2) * radius,
            Math.sin((i / 100) * Math.PI * 2) * radius,
            0,
          ),
      );
      const object = line(points, tint, opacity);
      object.rotation.copy(rotation);
      return object;
    }

    const nodeMeshes: THREE.Mesh<
      THREE.SphereGeometry,
      THREE.MeshStandardMaterial
    >[] = [];
    const packetMeshes: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      offset: number;
      a: number;
      b: number;
    }[] = [];
    const floaters: { group: THREE.Object3D; y: number; phase: number }[] = [];
    const rotators: { group: THREE.Object3D; speed: number }[] = [];
    const positions: THREE.Vector3[] = [];

    if (pattern === "globe" || pattern === "mesh") {
      for (let i = 0; i < nodes; i++) {
        let p: THREE.Vector3;
        if (topology === "hub")
          p =
            i === 0
              ? new THREE.Vector3()
              : new THREE.Vector3(
                  Math.cos((i * Math.PI * 2) / (nodes - 1)) * 2.7,
                  Math.sin((i * Math.PI * 2) / (nodes - 1)) * 1.85,
                  Math.sin(i * 2.4) * 0.8,
                );
        else if (topology === "ring")
          p = new THREE.Vector3(
            Math.cos((i / nodes) * Math.PI * 2) * 2.7,
            Math.sin((i / nodes) * Math.PI * 2) * 1.9,
            Math.sin((i / nodes) * Math.PI * 2) * 0.7,
          );
        else {
          const y = 1 - (i / (nodes - 1)) * 2;
          const r = Math.sqrt(1 - y * y);
          const theta = i * Math.PI * (3 - Math.sqrt(5));
          p = new THREE.Vector3(
            Math.cos(theta) * r * 2.7,
            y * 2.45,
            Math.sin(theta) * r * 2.7,
          );
        }
        positions.push(p);
        const tint = i % 3 === 0 ? VIOLET : color;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(i % 3 === 0 ? 0.085 : 0.06, 16, 12),
          new THREE.MeshStandardMaterial({
            color: tint,
            emissive: tint,
            emissiveIntensity: 1.5,
            metalness: 0.2,
            roughness: 0.5,
          }),
        );
        mesh.position.copy(p);
        mesh.userData.node = i;
        world.add(mesh);
        glow(mesh, tint, i % 3 === 0 ? 0.7 : 0.5);
        nodeMeshes.push(mesh);
        if (i % 3 === 0) {
          const torus = new THREE.Mesh(
            new THREE.TorusGeometry(0.17, 0.006, 5, 32),
            new THREE.MeshBasicMaterial({
              color: tint,
              transparent: true,
              opacity: 0.7,
            }),
          );
          mesh.add(torus);
          torus.rotation.x = -0.4;
        }
      }
      for (const [a, b] of networkEdges(nodes, topology)) {
        const start = positions[a],
          end = positions[b];
        const mid = start.clone().lerp(end, 0.5).multiplyScalar(1.15);
        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        line(curve.getPoints(28), a % 3 === 0 ? "#7e75bd" : "#567a69", 0.32);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.026, 8, 6),
          new THREE.MeshBasicMaterial({ color: a % 3 === 0 ? VIOLET : color }),
        );
        glow(mesh, a % 3 === 0 ? VIOLET : color, 0.23);
        world.add(mesh);
        packetMeshes.push({
          mesh,
          curve,
          offset: (a * 0.13 + b * 0.19) % 1,
          a,
          b,
        });
      }
      if (pattern === "globe") {
        const core = new THREE.Group();
        world.add(core);
        for (let i = 0; i < 3; i++) {
          const block = cube(
            0.67,
            i === 1 ? color : VIOLET,
            new THREE.Vector3((i - 1) * 0.95, 0.02, 0),
            core,
          );
          block.rotation.set(0.15, Math.PI / 4, 0.08);
          floaters.push({ group: block, y: 0.02, phase: i * 1.3 });
          if (i < 2)
            line(
              [
                new THREE.Vector3((i - 1) * 0.95 + 0.4, 0.02, 0),
                new THREE.Vector3(i * 0.95 - 0.4, 0.02, 0),
              ],
              color,
              0.8,
              core,
            );
        }
      }
      ring(3.12, new THREE.Euler(Math.PI / 2, 0, 0), color, 0.13).position.y =
        -2.55;
      ring(
        3.36,
        new THREE.Euler(Math.PI / 2, 0, 0),
        "#709789",
        0.08,
      ).position.y = -2.55;
    } else if (pattern === "chain") {
      for (let i = 0; i < 5; i++) {
        const g = cube(
          0.85,
          i === 4 ? color : VIOLET,
          new THREE.Vector3((i - 2) * 1.2, (i - 2) * 0.28, 0),
        );
        g.rotation.set(0.2, 0.5, -0.05);
        floaters.push({ group: g, y: g.position.y, phase: i * 0.6 });
        if (i < 4)
          line(
            [
              new THREE.Vector3((i - 2) * 1.2 + 0.4, (i - 2) * 0.28, 0),
              new THREE.Vector3((i - 1) * 1.2 - 0.4, (i - 1) * 0.28, 0),
            ],
            color,
            0.65,
          );
        glow(g, i === 4 ? color : VIOLET, 1.4);
      }
    } else if (pattern === "rollup") {
      for (let i = 0; i < 24; i++) {
        const g = cube(
          0.32,
          i % 4 ? color : VIOLET,
          new THREE.Vector3(
            -2.2 + (i % 4) * 0.47,
            Math.floor(i / 4) * 0.46 - 1.1,
            Math.sin(i) * 0.3,
          ),
        );
        floaters.push({ group: g, y: g.position.y, phase: i * 0.4 });
      }
      for (let i = 0; i < 3; i++) {
        const g = cube(0.8, color, new THREE.Vector3(1.8, (i - 1) * 1.2, 0));
        g.rotation.y = 0.5;
        line(
          [
            new THREE.Vector3(-0.4, (i - 1) * 0.7, 0),
            new THREE.Vector3(1.3, (i - 1) * 1.2, 0),
          ],
          color,
          0.6,
        );
        glow(g, color, 1.8);
      }
    } else if (pattern === "bridge") {
      [-1, 1].forEach((sign, i) => {
        const tower = cube(
          1,
          i ? color : VIOLET,
          new THREE.Vector3(sign * 2.3, -0.1, 0),
        );
        tower.rotation.y = 0.4;
        glow(tower, i ? color : VIOLET, 2);
      });
      for (let i = 0; i < 7; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.3, 0.3, 0),
          new THREE.Vector3(0, 1.7 + i * 0.05, Math.sin(i) * 0.5),
          new THREE.Vector3(2.3, 0.3, 0),
        ]);
        line(curve.getPoints(40), color, i === 0 ? 0.4 : 0.07);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 8),
          new THREE.MeshBasicMaterial({ color }),
        );
        glow(mesh, color, 0.4);
        world.add(mesh);
        packetMeshes.push({ mesh, curve, offset: i / 7, a: 0, b: 1 });
      }
    } else if (pattern === "vault") {
      for (let i = 0; i < 5; i++) {
        const g = cube(
          1.7,
          i % 2 ? VIOLET : color,
          new THREE.Vector3(0, i * 0.19 - 0.8, 0),
        );
        g.scale.y = 0.2;
        g.rotation.y = Math.PI / 4;
        floaters.push({ group: g, y: g.position.y, phase: i * 0.4 });
      }
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.12, 48),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.2,
          metalness: 0.75,
          roughness: 0.3,
        }),
      );
      coin.position.y = 1.1;
      coin.rotation.x = 0.5;
      world.add(coin);
      glow(coin, color, 2);
      rotators.push({ group: coin, speed: 0.5 });
      ring(2.5, new THREE.Euler(1.2, 0.3, 0.1), color, 0.3);
    } else if (pattern === "shield") {
      const shape = new THREE.IcosahedronGeometry(1.55, 0);
      const group = new THREE.Group();
      world.add(group);
      group.add(
        new THREE.Mesh(
          shape,
          new THREE.MeshStandardMaterial({
            color: "#1b2636",
            emissive: color,
            emissiveIntensity: 0.12,
            transparent: true,
            opacity: 0.55,
            roughness: 0.2,
            metalness: 0.7,
          }),
        ),
      );
      group.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(shape),
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
          }),
        ),
      );
      rotators.push({ group, speed: 0.18 });
      glow(group, color, 3.4);
      for (let i = 0; i < 3; i++)
        rotators.push({
          group: ring(
            2.3 + i * 0.22,
            new THREE.Euler(i * 0.8, i * 0.7, 0.6),
            i % 2 ? VIOLET : color,
            0.3,
          ),
          speed: 0.08 + i * 0.03,
        });
    } else if (pattern === "identity") {
      for (let i = 0; i < 3; i++) {
        const g = cube(
          1.9,
          i === 1 ? color : VIOLET,
          new THREE.Vector3((i - 1) * 0.7, (i - 1) * 0.3, -(i - 1) * 0.9),
        );
        g.scale.set(1, 0.65, 0.09);
        g.rotation.y = -0.3;
        floaters.push({ group: g, y: g.position.y, phase: i });
        glow(g, i === 1 ? color : VIOLET, 2);
      }
      ring(2.65, new THREE.Euler(0.2, 0.6, 0.4), color, 0.22);
    } else {
      for (let i = 0; i < (pattern === "swarm" ? 36 : 12); i++) {
        const angle = i * 0.72;
        const radius = pattern === "swarm" ? 1.2 + (i % 3) * 0.5 : 2;
        const g = cube(
          pattern === "swarm" ? 0.25 : 0.46,
          i % 3 ? color : VIOLET,
          new THREE.Vector3(
            Math.cos(angle) * radius,
            pattern === "swarm" ? (i / 36 - 0.5) * 3.8 : Math.sin(angle) * 1.5,
            Math.sin(angle) * radius,
          ),
        );
        floaters.push({ group: g, y: g.position.y, phase: i * 0.2 });
      }
      for (let i = 0; i < 3; i++)
        rotators.push({
          group: ring(
            2.6,
            new THREE.Euler(i * 0.9, i * 0.8, 0.2),
            i % 2 ? VIOLET : color,
            0.35,
          ),
          speed: 0.05 + i * 0.02,
        });
    }

    // Distant stars add depth without external textures or heavy post-processing.
    const stars = new Float32Array(110 * 3);
    for (let i = 0; i < 110; i++) {
      stars[i * 3] = Math.sin(i * 127.1) * 11;
      stars[i * 3 + 1] = Math.cos(i * 311.7) * 6;
      stars[i * 3 + 2] = -5 - ((i * 13) % 9);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: "#96b3b9",
          size: 0.019,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );

    let width = 1,
      height = 1;
    const resize = () => {
      width = Math.max(host.clientWidth, 1);
      height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = zoom * (width / height < 1.1 ? 1.35 : 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let dragging = false,
      moved = false,
      px = 0,
      py = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      px = e.clientX;
      py = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - px,
        dy = e.clientY - py;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      world.rotation.y += dx * 0.006;
      world.rotation.x = THREE.MathUtils.clamp(
        world.rotation.x + dy * 0.004,
        -0.65,
        0.65,
      );
      px = e.clientX;
      py = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!moved && latest.current.onSelect) {
        const bounds = canvas.getBoundingClientRect();
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((e.clientX - bounds.left) / width) * 2 - 1,
            (-(e.clientY - bounds.top) / height) * 2 + 1,
          ),
          camera,
        );
        const hit = raycaster.intersectObjects(nodeMeshes)[0];
        if (hit) latest.current.onSelect(hit.object.userData.node);
      }
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      if (document.activeElement !== canvas) return;
      e.preventDefault();
      zoom = THREE.MathUtils.clamp(zoom + e.deltaY * 0.005, 7, 17);
      resize();
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "-",
          "=",
          "Enter",
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key === "ArrowLeft") world.rotation.y -= 0.14;
      if (e.key === "ArrowRight") world.rotation.y += 0.14;
      if (e.key === "ArrowUp")
        world.rotation.x = Math.max(-0.65, world.rotation.x - 0.1);
      if (e.key === "ArrowDown")
        world.rotation.x = Math.min(0.65, world.rotation.x + 0.1);
      if (e.key === "+" || e.key === "=") {
        zoom = Math.max(7, zoom - 0.5);
        resize();
      }
      if (e.key === "-") {
        zoom = Math.min(17, zoom + 0.5);
        resize();
      }
      if (e.key === "Enter" && latest.current.onSelect)
        latest.current.onSelect(((latest.current.selected ?? -1) + 1) % nodes);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", () => {
      dragging = false;
    });
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("keydown", keydown);
    const lost = (event: Event) => {
      event.preventDefault();
      setFallback(true);
    };
    canvas.addEventListener("webglcontextlost", lost);
    let frame = 0,
      time = 0,
      last = performance.now();
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      // A queued animation frame can predate this effect's performance.now().
      // Keep curve parameters nonnegative on the first frame after navigation.
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05);
      last = now;
      const active = latest.current.playing && !document.hidden;
      if (active) time += dt;
      if (active && !dragging) world.rotation.y += dt * 0.035;
      floaters.forEach(({ group, y, phase }) => {
        group.position.y = y + Math.sin(time * 0.8 + phase) * 0.09;
      });
      rotators.forEach(({ group, speed }) => {
        if (active) group.rotation.y += dt * speed;
      });
      packetMeshes.forEach(({ mesh, curve, offset, a, b }) => {
        const current = latest.current;
        const from = current.arrivals?.[a],
          to = current.arrivals?.[b];
        if (
          current.progress !== undefined &&
          from !== undefined &&
          to !== undefined
        ) {
          const first = Math.min(from, to),
            lastArrival = Math.max(from, to);
          mesh.visible =
            Number.isFinite(lastArrival) &&
            lastArrival > first &&
            current.progress >= first &&
            current.progress <= lastArrival &&
            !current.offline?.has(a) &&
            !current.offline?.has(b);
          if (mesh.visible) {
            const fraction = THREE.MathUtils.clamp(
              (current.progress - first) / (lastArrival - first),
              0,
              1,
            );
            mesh.position.copy(
              curve.getPoint(from <= to ? fraction : 1 - fraction),
            );
          }
        } else {
          mesh.position.copy(curve.getPoint((time * 0.19 + offset) % 1));
          mesh.visible = !current.offline?.has(a) && !current.offline?.has(b);
        }
      });
      nodeMeshes.forEach((mesh, i) => {
        const isDown = latest.current.offline?.has(i);
        const reached =
          latest.current.progress === undefined ||
          (latest.current.arrivals?.[i] ?? Infinity) <= latest.current.progress;
        const picked = latest.current.selected === i;
        mesh.scale.setScalar(picked ? 1.8 : 1);
        mesh.material.color.set(
          isDown
            ? "#46515d"
            : picked
              ? "#ffffff"
              : i % 3 === 0
                ? VIOLET
                : color,
        );
        mesh.material.emissive.copy(mesh.material.color);
        mesh.material.emissiveIntensity = isDown ? 0.05 : reached ? 1.5 : 0.05;
        (mesh.children[0] as THREE.Sprite).visible = !isDown && reached;
      });
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        const obj = object as THREE.Mesh;
        obj.geometry?.dispose();
        if (obj.material)
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
            (m) => m.dispose(),
          );
      });
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [pattern, nodes, topology, color]);

  return (
    <div className={`scene ${className}`}>
      <div
        className="scene-mount"
        ref={mount}
        aria-hidden={fallback || undefined}
      />
      {fallback && (
        <div className="scene-fallback">
          <svg
            viewBox="0 0 600 380"
            role="img"
            aria-label="Network diagram in compatibility mode"
          >
            <defs>
              <radialGradient id="fallback-glow">
                <stop stopColor={color} stopOpacity=".18" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse
              cx="300"
              cy="190"
              rx="230"
              ry="160"
              fill="url(#fallback-glow)"
            />
            {networkEdges(nodes, topology).map(([a, b]) => {
              const point = (n: number) => [
                300 + Math.cos((n / nodes) * Math.PI * 2) * 200,
                185 + Math.sin((n / nodes) * Math.PI * 2) * 125,
              ];
              const p = point(a),
                q = point(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke={color}
                  strokeOpacity=".25"
                />
              );
            })}
            {Array.from({ length: nodes }, (_, i) => (
              <circle
                key={i}
                cx={300 + Math.cos((i / nodes) * Math.PI * 2) * 200}
                cy={185 + Math.sin((i / nodes) * Math.PI * 2) * 125}
                r={selected === i ? 8 : 5}
                fill={
                  offline?.has(i) ? "#667080" : i % 3 === 0 ? VIOLET : color
                }
              />
            ))}
            <path
              d="m265 163 35-20 35 20v42l-35 20-35-20zm0 0 35 21 35-21m-35 21v41"
              stroke={color}
              fill="#111e23"
              strokeWidth="2"
            />
          </svg>
          <span className="compatibility">
            2D compatibility view · WebGL unavailable
          </span>
        </div>
      )}
      <div className="scene-vignette" />
    </div>
  );
}
