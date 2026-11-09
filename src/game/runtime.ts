import * as THREE from "three";
import { areas } from "../atlas";
import {
  distance,
  hazardPosition,
  missions,
  movePosition,
  stake,
  type Position,
} from "./model";
import type { GameBridge, Telemetry } from "./types";

/** A courier, a bounded flight arena and collision fields inside the atlas renderer. */
export function createGameRuntime(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  bridge: () => GameBridge | undefined,
) {
  const first = bridge()!;
  const mission = missions[first.state.mission],
    center = areas[mission.area].position;
  const root = new THREE.Group();
  root.position.set(center[0], 0, center[2]);
  scene.add(root);
  const color = new THREE.Color(mission.color);
  const material = (tint: THREE.ColorRepresentation, emissive = 0) =>
    new THREE.MeshStandardMaterial({
      color: tint,
      emissive: tint,
      emissiveIntensity: emissive,
      metalness: 0.55,
      roughness: 0.38,
    });
  const mesh = (
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D = root,
  ) => {
    const item = new THREE.Mesh(geometry, mat);
    parent.add(item);
    return item;
  };
  const floor = mesh(
    new THREE.BoxGeometry(16, 0.25, 14),
    material("#102d3c", 0.04),
  );
  floor.position.y = -0.35;
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(floor.geometry),
    new THREE.LineBasicMaterial({
      color: mission.color,
      transparent: true,
      opacity: 0.6,
    }),
  );
  outline.position.copy(floor.position);
  root.add(outline);
  const grid = new THREE.GridHelper(16, 16, "#456e80", "#244352");
  grid.position.y = -0.21;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.45;
  root.add(grid);
  for (const [x, z] of [
    [-7.7, -6.7],
    [7.7, -6.7],
    [-7.7, 6.7],
    [7.7, 6.7],
  ]) {
    const post = mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6),
      material(mission.color, 0.6),
    );
    post.position.set(x, 0.1, z);
    const tip = mesh(
      new THREE.OctahedronGeometry(0.13),
      new THREE.MeshBasicMaterial({ color: mission.color }),
    );
    tip.position.set(x, 0.65, z);
  }
  for (const station of first.stations) {
    const pad = mesh(
      new THREE.CylinderGeometry(0.88, 1, 0.12, 24),
      material("#173f50", 0.15),
    );
    pad.position.set(station.x, -0.15, station.z);
    const ring = mesh(
      new THREE.TorusGeometry(0.92, 0.025, 5, 40),
      new THREE.MeshBasicMaterial({
        color: station.color ?? mission.color,
        transparent: true,
        opacity: 0.7,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(station.x, -0.06, station.z);
  }
  const drone = new THREE.Group();
  root.add(drone);
  const hull = mesh(
    new THREE.IcosahedronGeometry(0.36, 1),
    material("#e1eff0", 0.2),
    drone,
  );
  const core = mesh(
    new THREE.OctahedronGeometry(0.21),
    material(mission.color, 1),
    drone,
  );
  core.position.y = 0.15;
  for (const x of [-0.42, 0.42]) {
    const wing = mesh(
      new THREE.BoxGeometry(0.45, 0.07, 0.24),
      material("#718d9e", 0.1),
      drone,
    );
    wing.position.set(x, 0, 0.08);
    const thruster = mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.12, 12),
      material(mission.color, 1),
      drone,
    );
    thruster.position.set(x, -0.12, 0.08);
  }
  const nose = mesh(
    new THREE.ConeGeometry(0.12, 0.32, 4),
    material(mission.color, 0.8),
    drone,
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -0.43;
  const aura = mesh(
    new THREE.TorusGeometry(0.59, 0.017, 6, 40),
    new THREE.MeshBasicMaterial({
      color: mission.color,
      transparent: true,
      opacity: 0.7,
    }),
    drone,
  );
  aura.rotation.x = Math.PI / 2;
  aura.position.y = -0.24;
  const cargo = Array.from({ length: 6 }, () =>
    mesh(
      new THREE.OctahedronGeometry(0.085),
      material(mission.color, 0.9),
      drone,
    ),
  );
  cargo.forEach((item) => {
    item.visible = false;
  });
  const scanner = mesh(
    new THREE.TorusGeometry(0.7, 0.025, 5, 48),
    new THREE.MeshBasicMaterial({
      color: mission.color,
      transparent: true,
      opacity: 0,
    }),
  );
  scanner.rotation.x = Math.PI / 2;
  scanner.position.y = 0.08;
  const gauge = [2, 3].includes(first.state.mission)
    ? mesh(
        new THREE.RingGeometry(1, 1.07, 64),
        new THREE.MeshBasicMaterial({
          color: mission.color,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        }),
      )
    : null;
  if (gauge) {
    const station = first.stations.find(
      (node) => node.id === (first.state.mission === 2 ? "forge" : "quorum"),
    )!;
    gauge.position.set(station.x, -0.02, station.z);
    gauge.rotation.x = -Math.PI / 2;
    if (first.state.mission === 3) {
      const threshold = mesh(
        new THREE.BoxGeometry(0.22, 0.05, 0.07),
        new THREE.MeshBasicMaterial({ color: "#f2f8dc" }),
      );
      threshold.position.set(
        station.x + Math.cos((Math.PI * 4) / 3) * 1.04,
        0.01,
        station.z - Math.sin((Math.PI * 4) / 3) * 1.04,
      );
    }
  }
  const shadow = mesh(
    new THREE.RingGeometry(0.38, 0.58, 32),
    new THREE.MeshBasicMaterial({
      color: mission.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.03;
  const trail = Array.from({ length: 10 }, (_, i) => {
    const dot = mesh(
      new THREE.SphereGeometry(0.09 * (1 - i / 13), 6, 4),
      new THREE.MeshBasicMaterial({
        color: mission.color,
        transparent: true,
        opacity: 0.4 * (1 - i / 12),
      }),
    );
    dot.visible = false;
    return dot;
  });
  const hazards = Array.from({ length: mission.hazards }, () => {
    const group = new THREE.Group();
    root.add(group);
    mesh(new THREE.OctahedronGeometry(0.36), material("#f17790", 0.65), group);
    const ring = mesh(
      new THREE.TorusGeometry(0.68, 0.035, 5, 32),
      new THREE.MeshBasicMaterial({
        color: "#ff8f9f",
        transparent: true,
        opacity: 0.7,
      }),
      group,
    );
    ring.rotation.x = Math.PI / 2;
    return group;
  });
  const waypoint = mesh(
    new THREE.RingGeometry(0.32, 0.38, 24),
    new THREE.MeshBasicMaterial({
      color: "#e4f7a6",
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    }),
  );
  waypoint.rotation.x = -Math.PI / 2;
  waypoint.position.y = -0.02;
  waypoint.visible = false;
  const routeArray = new Float32Array(6),
    routeGeometry = new THREE.BufferGeometry();
  routeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(routeArray, 3),
  );
  const routeLine = new THREE.Line(
    routeGeometry,
    new THREE.LineBasicMaterial({
      color: mission.color,
      transparent: true,
      opacity: 0.35,
    }),
  );
  root.add(routeLine);
  routeLine.visible = false;
  let position = { ...first.position.current },
    destination: Position | null = null,
    arrival: string | null = null;
  let gaugeValue = -1,
    scan = 0,
    lastFeedback = first.state.feedback.serial;
  let time = 0,
    seconds = first.elapsed.current,
    lastPublish = -1,
    lastCommand = -1,
    dash = 0,
    cooldown = 0,
    invulnerability = 0;
  const keys = new Set<string>(),
    forward = new THREE.Vector3(),
    right = new THREE.Vector3(),
    worldPosition = new THREE.Vector3();
  const blockedTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest("input,select,textarea,dialog");
  const nearest = () => {
    let id: string | null = null,
      d = Infinity;
    for (const station of bridge()?.stations ?? []) {
      if (station.collectible && bridge()!.state.bag.includes(station.id))
        continue;
      const candidate = distance(position, station);
      if (candidate < d) {
        d = candidate;
        id = station.id;
      }
    }
    return { id, d };
  };
  const requestDash = () => {
    if (cooldown <= 0) {
      dash = 0.55;
      cooldown = 2.1;
    }
  };
  const keyDown = (event: KeyboardEvent) => {
    if (
      !bridge()?.running ||
      document.querySelector("dialog[open]") ||
      blockedTarget(event.target)
    )
      return;
    const key = event.key.toLowerCase();
    if (
      [" ", "enter"].includes(key) &&
      event.target instanceof Element &&
      event.target.closest("button")
    )
      return;
    if (
      ![
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowleft",
        "arrowdown",
        "arrowright",
        " ",
        "e",
        "enter",
      ].includes(key)
    )
      return;
    event.preventDefault();
    keys.add(key);
    destination = null;
    arrival = null;
    if (key === " " && !event.repeat) requestDash();
    if ((key === "e" || key === "enter") && !event.repeat) {
      const n = nearest();
      if (n.id && n.d < 1.5) bridge()?.onInteract(n.id);
    }
  };
  const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
  const clear = () => keys.clear();
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clear);
  function navigate(point: Position, id: string | null = null) {
    destination = {
      x: Math.max(-7.25, Math.min(7.25, point.x)),
      z: Math.max(-6.15, Math.min(6.15, point.z)),
    };
    arrival = id;
  }
  function update(dt: number) {
    const current = bridge();
    if (!current) return false;
    if (gauge) {
      const value =
        current.state.mission === 3
          ? stake(current.state) / 100
          : current.state.bag.filter((id) => id.startsWith("leaf")).length / 4;
      if (value !== gaugeValue) {
        gauge.geometry.dispose();
        gauge.geometry = new THREE.RingGeometry(
          1,
          1.07,
          64,
          1,
          0,
          Math.max(0.001, value) * Math.PI * 2,
        );
        gauge.visible = value > 0;
        gaugeValue = value;
      }
    }
    if (current.state.feedback.serial !== lastFeedback) {
      lastFeedback = current.state.feedback.serial;
      scan = 1;
      (scanner.material as THREE.MeshBasicMaterial).color.set(
        current.state.feedback.tone === "error"
          ? "#ff8fa7"
          : current.state.feedback.tone === "success"
            ? "#c4f568"
            : mission.color,
      );
    }
    const command = current.command;
    if (command && command.serial !== lastCommand) {
      lastCommand = command.serial;
      if (command.type === "dash") requestDash();
      else {
        const station = current.stations.find((s) => s.id === command.id);
        if (station) navigate(station, command.id);
      }
    }
    if (!current.running) {
      keys.clear();
      return false;
    }
    time += dt;
    seconds += dt;
    current.elapsed.current = seconds;
    dash = Math.max(0, dash - dt);
    cooldown = Math.max(0, cooldown - dt);
    invulnerability = Math.max(0, invulnerability - dt);
    const before = { ...position };
    if (destination && current.reduced) {
      position = { ...destination };
    } else if (destination) {
      const dx = destination.x - position.x,
        dz = destination.z - position.z,
        d = Math.hypot(dx, dz);
      if (d > 0.12)
        position = movePosition(
          position,
          { x: dx / d, z: dz / d },
          Math.min(dt, d / (dash > 0 ? 9 : 4.2)),
          dash > 0,
        );
    }
    const horizontal =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
      current.steer.current.x;
    const vertical =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      current.steer.current.z;
    if (horizontal || vertical) {
      destination = null;
      arrival = null;
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
      position = movePosition(
        position,
        {
          x: right.x * horizontal + forward.x * vertical,
          z: right.z * horizontal + forward.z * vertical,
        },
        dt,
        dash > 0,
      );
    }
    current.position.current = { ...position };
    if (destination && distance(position, destination) < 0.2) {
      const id = arrival;
      destination = null;
      arrival = null;
      lastPublish = -Infinity;
      if (id) current.onInteract(id);
    }
    const moved = distance(before, position) > 0.001;
    drone.position.set(
      position.x,
      0.72 + (current.reduced ? 0 : Math.sin(time * 5) * 0.035),
      position.z,
    );
    if (moved)
      drone.rotation.y = Math.atan2(
        -(position.x - before.x),
        -(position.z - before.z),
      );
    drone.rotation.z = current.reduced ? 0 : Math.sin(time * 3) * 0.035;
    const cargoCount =
      current.state.mission === 1
        ? current.state.route.length
          ? 1
          : 0
        : current.state.bag.filter((id) => id !== "rejected-vote").length;
    cargo.forEach((item, i) => {
      item.visible = i < cargoCount;
      const angle =
        (current.reduced ? 0 : time * 0.9) +
        (i * Math.PI * 2) / Math.max(1, cargoCount);
      item.position.set(
        Math.cos(angle) * 0.82,
        0.22 + (current.reduced ? 0 : Math.sin(time * 2 + i) * 0.08),
        Math.sin(angle) * 0.82,
      );
    });
    scan = Math.max(0, scan - dt * 1.2);
    scanner.visible = scan > 0 && !current.reduced;
    scanner.position.x = position.x;
    scanner.position.z = position.z;
    scanner.scale.setScalar(1 + (1 - scan) * 2);
    (scanner.material as THREE.MeshBasicMaterial).opacity = scan * 0.55;
    (hull.material as THREE.MeshStandardMaterial).emissive.set(
      invulnerability > 0 ? "#f59291" : "#b6e4de",
    );
    (hull.material as THREE.MeshStandardMaterial).emissiveIntensity =
      invulnerability > 0 ? 0.7 : dash > 0 ? 0.8 : 0.15;
    shadow.position.x = position.x;
    shadow.position.z = position.z;
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].visible = moved && !current.reduced;
      if (i > 0) trail[i].position.lerp(trail[i - 1].position, 0.65);
      else trail[i].position.set(position.x, 0.5, position.z + 0.1);
    }
    hazards.forEach((hazard, i) => {
      const point = hazardPosition(i, time, current.reduced);
      hazard.position.set(point.x, 0.45, point.z);
      hazard.rotation.y = current.reduced ? 0 : time * 0.8;
      if (
        invulnerability <= 0 &&
        dash <= 0 &&
        distance(position, point) < 0.76
      ) {
        invulnerability = 1.8;
        current.onHit();
        destination = null;
        arrival = null;
      }
    });
    waypoint.visible = !!destination;
    routeLine.visible = !!destination && !current.reduced;
    if (destination) {
      waypoint.position.x = destination.x;
      waypoint.position.z = destination.z;
      routeArray.set([
        position.x,
        0.12,
        position.z,
        destination.x,
        0.12,
        destination.z,
      ]);
      (routeGeometry.attributes.position as THREE.BufferAttribute).needsUpdate =
        true;
    }
    if (time - lastPublish > 0.1) {
      lastPublish = time;
      const n = nearest();
      const value: Telemetry = {
        ...position,
        seconds,
        near: n.d < 1.5 ? n.id : null,
        distance: n.d,
        boost: 1 - cooldown / 2.1,
      };
      current.onTelemetry(value);
    }
    return true;
  }
  drone.position.set(position.x, 0.72, position.z);
  hazards.forEach((h, i) => {
    const p = hazardPosition(i, 0, first.reduced);
    h.position.set(p.x, 0.45, p.z);
  });
  return {
    update,
    worldPosition: () =>
      worldPosition.set(center[0] + position.x, 0.65, center[2] + position.z),
    navigateWorld: (point: THREE.Vector3) =>
      navigate({ x: point.x - center[0], z: point.z - center[2] }),
    dispose: () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear);
    },
    color,
  };
}
