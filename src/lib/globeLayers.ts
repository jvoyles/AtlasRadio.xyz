import type { CustomLayerInterface, Map as MapLibreMap } from "maplibre-gl";

// Custom WebGL layers ported from devglobe.app's own globe: a soft blue
// atmosphere halo drawn around the sphere, and a 26,000-star celestial
// sphere that rotates with the camera (which is what makes the background
// look like it's turning in 3D rather than sitting flat behind the map).

type Stop = [number, string];

const HALO_STOPS: Stop[] = [
  [0, "rgba(140, 195, 240, 1.0)"],
  [0.04, "rgba(125, 188, 238, 0.85)"],
  [0.1, "rgba(106, 168, 225, 0.65)"],
  [0.2, "rgba(85, 148, 215, 0.45)"],
  [0.35, "rgba(65, 125, 200, 0.25)"],
  [0.55, "rgba(45, 100, 180, 0.12)"],
  [0.8, "rgba(30, 80, 160, 0.05)"],
  [1.2, "rgba(20, 65, 145, 0.02)"],
  [1.8, "rgba(15, 50, 130, 0.0)"],
];

const HALO_QUAD = new Float32Array([-6, -6, 0, 6, -6, 0, -6, 6, 0, 6, 6, 0]);

const HALO_VERTEX = `
attribute vec3 a_position;
uniform mat4 u_matrix;
uniform mat4 u_rotationMatrix;
uniform float u_scale;
varying vec2 v_pos;
varying float v_scale;
void main() {
  v_scale = u_scale;
  v_pos = a_position.xy * u_scale;
  gl_Position = u_matrix * u_rotationMatrix * vec4(a_position, 1.0);
}
`;

const HALO_FRAGMENT = `
precision mediump float;
varying vec2 v_pos;
varying float v_scale;
uniform int u_stopsNumber;
uniform float u_stops[10];
uniform vec4 u_colors[10];
uniform float u_maxDistance;

const float EPSILON = 0.000001;

void main() {
  vec2 center = vec2(0.0, 0.0);
  float rawDistance = distance(center, v_pos);
  float distanceFromGlobeEdge = rawDistance - 1.0;

  if (rawDistance > u_maxDistance * v_scale) {
    discard;
  }

  vec4 color = u_colors[0];

  for (int i = 1; i < 10; i++) {
    if (i >= u_stopsNumber) {
      color = u_colors[i - 1];
      break;
    }

    float scaledStopPosition = u_stops[i] * pow(v_scale, 1.6);
    float lastStopValue = u_stops[i - 1];
    float thisStopValue = u_stops[i];

    float numbersAreEqual = 1.0 - step(EPSILON, abs(lastStopValue - thisStopValue));
    lastStopValue = lastStopValue - numbersAreEqual * EPSILON;

    float lastScaledStopPosition = lastStopValue * pow(v_scale, 1.6);

    if (distanceFromGlobeEdge <= scaledStopPosition) {
      float stopBlendFactor = (distanceFromGlobeEdge - lastScaledStopPosition) / (scaledStopPosition - lastScaledStopPosition);
      color = mix(u_colors[i - 1], u_colors[i], stopBlendFactor);
      break;
    }
  }

  gl_FragColor = vec4(color.rgb * color.a, color.a);
}
`;

const STAR_COUNT = 26000;

const STAR_VERTEX = `
attribute vec3 a_dir;
attribute float a_size;
attribute float a_phase;
attribute float a_bright;
uniform mat4 u_matrix;
uniform float u_time;
uniform float u_pixelRatio;
varying float v_bright;
void main() {
  vec4 clip = u_matrix * vec4(a_dir * 1000.0, 1.0);
  gl_Position = vec4(clip.xy, 0.0, clip.w);
  float twinkle = 0.78 + 0.22 * sin(u_time * 1.2 + a_phase);
  v_bright = a_bright * twinkle;
  gl_PointSize = a_size * u_pixelRatio;
}
`;

const STAR_FRAGMENT = `
precision mediump float;
varying float v_bright;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.34, d);
  float glow = smoothstep(0.5, 0.0, d) * 0.35;
  float alpha = min(core + glow, 1.0) * v_bright;
  gl_FragColor = vec4(vec3(alpha), alpha);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Globe shader error:", gl.getShaderInfoLog(shader));
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  return program;
}

const normalize = (v: number[]) => {
  const len = Math.hypot(v[0], v[1], v[2]);
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
};
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function parseRgba(color: string) {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  return m
    ? [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255, m[4] !== undefined ? parseFloat(m[4]) : 1]
    : [0, 0, 0, 0];
}

// Camera position in globe space: the eye is the NDC point (0, 0, -1) pulled
// back through the inverse of the projection matrix.
function cameraPositionFromMatrix(m: ArrayLike<number>) {
  const inv = new Array<number>(16);
  const a = m;
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4];
  const b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5];
  const b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
  const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12];
  const b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13];
  const b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return [0, 0, 1];
  const d = 1 / det;
  inv[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d;
  inv[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d;
  inv[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d;
  inv[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
  inv[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d;
  inv[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d;
  inv[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d;
  inv[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
  inv[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d;
  inv[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d;
  inv[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d;
  inv[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
  inv[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d;
  inv[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d;
  inv[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d;
  inv[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
  const x = -inv[8] + inv[12];
  const y = -inv[9] + inv[13];
  const z = -inv[10] + inv[14];
  const w = -inv[11] + inv[15];
  return [x / w, y / w, z / w];
}

export function createAtmosphereHalo(): CustomLayerInterface {
  let map: MapLibreMap | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let loc: Record<string, number | WebGLUniformLocation | null> = {};

  return {
    id: "atmosphere-halo",
    type: "custom",
    renderingMode: "3d",
    onAdd(m, gl) {
      map = m;
      program = link(gl as WebGL2RenderingContext, HALO_VERTEX, HALO_FRAGMENT);
      const g = gl as WebGL2RenderingContext;
      loc = {
        position: g.getAttribLocation(program, "a_position"),
        matrix: g.getUniformLocation(program, "u_matrix"),
        rotationMatrix: g.getUniformLocation(program, "u_rotationMatrix"),
        scale: g.getUniformLocation(program, "u_scale"),
        stopsNumber: g.getUniformLocation(program, "u_stopsNumber"),
        stops: g.getUniformLocation(program, "u_stops"),
        colors: g.getUniformLocation(program, "u_colors"),
        maxDistance: g.getUniformLocation(program, "u_maxDistance"),
      };
      buffer = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, buffer);
      g.bufferData(g.ARRAY_BUFFER, HALO_QUAD, g.STATIC_DRAW);
    },
    render(gl, options) {
      if (!program || !map) return;
      const projection = map.getProjection();
      if (!projection || projection.type !== "globe") return;

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc.position as number);
      gl.vertexAttribPointer(loc.position as number, 3, gl.FLOAT, false, 0, 0);

      const main = options.defaultProjectionData.mainMatrix as unknown as ArrayLike<number>;
      const scale = [0.9, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 1];
      const matrix = new Float32Array(16);
      for (let a = 0; a < 4; a++) {
        for (let n = 0; n < 4; n++) {
          matrix[4 * n + a] =
            main[0 + a] * scale[4 * n + 0] +
            main[4 + a] * scale[4 * n + 1] +
            main[8 + a] * scale[4 * n + 2] +
            main[12 + a] * scale[4 * n + 3];
        }
      }
      gl.uniformMatrix4fv(loc.matrix as WebGLUniformLocation, false, matrix);

      const cam = cameraPositionFromMatrix(main);
      const forward = normalize([cam[0], cam[1], cam[2]]);
      let right = normalize(cross([0, 1, 0], forward));
      if (right[0] === 0 && right[1] === 0 && right[2] === 0) right = [1, 0, 0];
      const up = normalize(cross(forward, right));
      gl.uniformMatrix4fv(
        loc.rotationMatrix as WebGLUniformLocation,
        false,
        new Float32Array([...right, 0, ...up, 0, ...forward, 0, 0, 0, 0, 1])
      );

      const stops = new Float32Array(10);
      const colors = new Float32Array(40);
      HALO_STOPS.forEach(([position, color], i) => {
        stops[i] = position;
        colors.set(parseRgba(color), 4 * i);
      });
      gl.uniform1i(loc.stopsNumber as WebGLUniformLocation, HALO_STOPS.length);
      gl.uniform1fv(loc.stops as WebGLUniformLocation, stops);
      gl.uniform4fv(loc.colors as WebGLUniformLocation, colors);
      gl.uniform1f(loc.maxDistance as WebGLUniformLocation, 6);
      gl.uniform1f(loc.scale as WebGLUniformLocation, 0.9);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    onRemove(_m, gl) {
      const g = gl as WebGL2RenderingContext;
      if (program) g.deleteProgram(program);
      if (buffer) g.deleteBuffer(buffer);
    },
  };
}

export function createStarfield(): CustomLayerInterface {
  let map: MapLibreMap | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let loc: Record<string, number | WebGLUniformLocation | null> = {};

  // Six floats per star: direction xyz, size, twinkle phase, brightness.
  const data = new Float32Array(STAR_COUNT * 6);
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    const big = Math.random() > 0.88;
    const o = 6 * i;
    data[o] = sinPhi * Math.cos(theta);
    data[o + 1] = Math.cos(phi);
    data[o + 2] = sinPhi * Math.sin(theta);
    data[o + 3] = big ? 3.4 + 2.4 * Math.random() : 1.6 + 1.4 * Math.random();
    data[o + 4] = Math.random() * Math.PI * 2;
    data[o + 5] = big ? 0.8 + 0.2 * Math.random() : 0.45 + 0.4 * Math.random();
  }

  return {
    id: "starfield",
    type: "custom",
    renderingMode: "3d",
    onAdd(m, gl) {
      map = m;
      const g = gl as WebGL2RenderingContext;
      program = link(g, STAR_VERTEX, STAR_FRAGMENT);
      loc = {
        dir: g.getAttribLocation(program, "a_dir"),
        size: g.getAttribLocation(program, "a_size"),
        phase: g.getAttribLocation(program, "a_phase"),
        bright: g.getAttribLocation(program, "a_bright"),
        matrix: g.getUniformLocation(program, "u_matrix"),
        time: g.getUniformLocation(program, "u_time"),
        pixelRatio: g.getUniformLocation(program, "u_pixelRatio"),
      };
      buffer = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, buffer);
      g.bufferData(g.ARRAY_BUFFER, data, g.STATIC_DRAW);
    },
    render(gl, options) {
      if (!program || !map) return;
      const projection = map.getProjection();
      if (!projection || projection.type !== "globe") return;

      gl.useProgram(program);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc.dir as number);
      gl.vertexAttribPointer(loc.dir as number, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(loc.size as number);
      gl.vertexAttribPointer(loc.size as number, 1, gl.FLOAT, false, 24, 12);
      gl.enableVertexAttribArray(loc.phase as number);
      gl.vertexAttribPointer(loc.phase as number, 1, gl.FLOAT, false, 24, 16);
      gl.enableVertexAttribArray(loc.bright as number);
      gl.vertexAttribPointer(loc.bright as number, 1, gl.FLOAT, false, 24, 20);
      gl.uniformMatrix4fv(loc.matrix as WebGLUniformLocation, false, options.defaultProjectionData.mainMatrix as unknown as Float32List);
      gl.uniform1f(loc.time as WebGLUniformLocation, performance.now() / 1000);
      gl.uniform1f(loc.pixelRatio as WebGLUniformLocation, window.devicePixelRatio || 1);
      gl.drawArrays(gl.POINTS, 0, STAR_COUNT);
    },
    onRemove(_m, gl) {
      const g = gl as WebGL2RenderingContext;
      if (program) g.deleteProgram(program);
      if (buffer) g.deleteBuffer(buffer);
    },
  };
}

// devglobe's "color" theme: the OpenFreeMap liberty style recolored into a
// warm satellite-like palette over its natural-earth raster, with road
// labels hidden and place names forced to Latin script.
export function applyTerrainPalette(map: MapLibreMap) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (
      layer.type === "symbol" &&
      ["road", "highway", "motorway", "trunk", "street", "path"].some((k) => layer.id.includes(k))
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }

  const paint = (id: string, prop: string, value: string | number) => {
    try {
      (map.setPaintProperty as (id: string, prop: string, value: unknown) => void).call(map, id, prop, value);
    } catch {}
  };
  paint("background", "background-color", "#b8b070");
  paint("landcover_wood", "fill-color", "#8aaa68");
  paint("landcover_grass", "fill-color", "#a0b870");
  paint("landcover_sand", "fill-color", "#c8b060");
  paint("landcover_ice", "fill-color", "#c8e4e8");
  paint("park", "fill-color", "#90b068");
  paint("landcover_wetland", "fill-color", "#88a468");
  paint("water", "fill-color", "#4a9ee0");
  for (const id of ["waterway_river", "waterway_other", "waterway_tunnel"]) paint(id, "line-color", "#3888d0");
  try {
    map.setLayoutProperty("park_outline", "visibility", "none");
  } catch {}
  paint("landuse_residential", "fill-color", "#c4b088");
  paint("building", "fill-color", "#b8a880");
  paint("natural_earth", "raster-opacity", 0.6);
  paint("natural_earth", "raster-saturation", 0.6);
  paint("natural_earth", "raster-contrast", 0.2);
  paint("natural_earth", "raster-brightness-min", 0.1);
  paint("natural_earth", "raster-brightness-max", 0.9);

  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type !== "symbol") continue;
    const field = map.getLayoutProperty(layer.id, "text-field");
    if (field && JSON.stringify(field).includes("name")) {
      try {
        map.setLayoutProperty(layer.id, "text-field", [
          "coalesce",
          ["get", "name_en"],
          ["get", "name:latin"],
          ["get", "name"],
        ]);
      } catch {}
    }
  }
}
