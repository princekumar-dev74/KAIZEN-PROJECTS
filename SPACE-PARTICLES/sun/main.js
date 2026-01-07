(() => {
  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl");
  const errEl = document.getElementById("err");
  const speedEl = document.getElementById("speed");

  function resize() {
	const d = window.devicePixelRatio || 1;
	canvas.width = innerWidth * d;
	canvas.height = innerHeight * d;
	canvas.style.width = innerWidth+"px";
	canvas.style.height = innerHeight+"px";
	gl.viewport(0,0,canvas.width,canvas.height);
  }
  resize();
  addEventListener("resize", resize);

  const vert = `
	attribute vec2 pos;
	void main() {
	  gl_Position = vec4(pos, 0.0, 1.0);
	}
  `;

  // Your shader, adapted to WebGL1
  const frag = `
	precision highp float;

	uniform vec2 u_res;
	uniform float u_time;
	uniform float u_speed;

	void main() {
	  vec2 FC = gl_FragCoord.xy;
	  float t = u_time * u_speed;
	  vec2 r = u_res;
	  vec2 p = (FC * 2.0 - r) / r.y;

	  vec3 c = vec3(0.0);

	  for (float i = 0.0; i < 42.0; i++) {
		float a = i / 1.5 + t * 0.5;

		vec2 q = p;
		q.x = q.x + sin(q.y * 19.0 + t * 2.0 + i) * 
			  29.0 * smoothstep(0.0, -2.0, q.y);

		float d = length(q - vec2(cos(a), sin(a)) * 
						 (0.4 * smoothstep(0.0, 0.5, -q.y)));

		c = c + vec3(0.34, 0.30, 0.24) * (0.015 / d);
	  }

	  vec3 col = c * c + 0.05;
	  gl_FragColor = vec4(col, 1.0);
	}
  `;

  function compile(src, type) {
	const s = gl.createShader(type);
	gl.shaderSource(s, src);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
	  const msg = gl.getShaderInfoLog(s);
	  throw new Error(msg);
	}
	return s;
  }

  function link(vs, fs) {
	const p = gl.createProgram();
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);
	gl.bindAttribLocation(p, 0, "pos");
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
	  throw new Error(gl.getProgramInfoLog(p));
	}
	return p;
  }

  let program;
  try {
	const vs = compile(vert, gl.VERTEX_SHADER);
	const fs = compile(frag, gl.FRAGMENT_SHADER);
	program = link(vs, fs);
  } catch (e) {
	errEl.style.display = "block";
	errEl.textContent = e.message;
	console.error(e);
	return;
  }

  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	-1,-1,   3,-1,   -1,3
  ]), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const u_res   = gl.getUniformLocation(program, "u_res");
  const u_time  = gl.getUniformLocation(program, "u_time");
  const u_speed = gl.getUniformLocation(program, "u_speed");

  let start = performance.now();

  function draw() {
	const now = performance.now();
	const t = (now - start) * 0.001;

	gl.uniform2f(u_res, canvas.width, canvas.height);
	gl.uniform1f(u_time, t);
	gl.uniform1f(u_speed, parseFloat(speedEl.value));

	gl.drawArrays(gl.TRIANGLES, 0, 3);
	requestAnimationFrame(draw);
  }

  draw();
})();