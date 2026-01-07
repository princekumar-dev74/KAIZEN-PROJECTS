import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import * as TWEEN from "three/addons/libs/tween.module.js";

console.clear();

const mu = THREE.MathUtils;

// load fonts
await (async function () {
  async function loadFont(fontface) {
    await fontface.load();
    document.fonts.add(fontface);
  }
  let fonts = [
    new FontFace(
      "Orbitron",
      "url(https://fonts.gstatic.com/s/orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2) format('woff2')"
    )
  ];
  for (let font in fonts) {
    await loadFont(fonts[font]);
  }
})();

class Postprocessing extends EffectComposer{
  constructor(renderer, scene, camera){
    super(renderer);
    const renderPass = new RenderPass(scene, camera);
    const filmPass = new FilmPass(0.75);
    
    this.uniforms = {
      transition: {value: 0},
      pointer: {value: new THREE.Vector2().setScalar(2)},
      clickStart: {value: 0},
      clickDuration: {value: 0.75},
      clickRadius: {value: 0.5} // of screen UV
    }

    window.addEventListener("pointerdown", event => {
      this.uniforms.pointer.value.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	    this.uniforms.pointer.value.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      this.uniforms.clickStart.value = gu.time.value;
    })
    
    filmPass.material.onBeforeCompile = shader => {
      shader.uniforms.timeVal = gu.time;
      
      shader.uniforms.aspect = gu.aspect;
      
      shader.uniforms.pointer = this.uniforms.pointer;
      shader.uniforms.clickStart = this.uniforms.clickStart;
      shader.uniforms.clickDuration = this.uniforms.clickDuration;
      shader.uniforms.clickRadius = this.uniforms.clickRadius;
      
      shader.uniforms.textTexture = {value: (() => {
        const c = document.createElement("canvas");
        c.width = 1024; c.height = 1024;
        const ctx = c.getContext("2d");
        const u = val => val * c.height * 0.01;

        ctx.font = `${u(29)}px Orbitron`;
        ctx.textAlign = "center";
        ctx.textBaseline = "center";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ["", ""].forEach((word, wordIdx) => {
          ctx.fillStyle = wordIdx == 0 ? "#a00" : "#666";
          ctx.strokeStyle = wordIdx == 0 ? "#fa0" : "#fff";
          ctx.lineWidth = u(4.5);
          const x = c.width * 0.5;
          const y = (1 - (0.25 + 0.5 * wordIdx)) * c.height;
          console.log(x, y, wordIdx);
          ctx.strokeText(word, x, y);
          ctx.fillText(word, x, y);
        })

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = "srgb";
        return tex;
      })()};
      shader.uniforms.transition = this.uniforms.transition;
      shader.fragmentShader = `
        uniform float timeVal;
        uniform float aspect;
        uniform float transition;
        uniform sampler2D textTexture;
        
        uniform vec2 pointer;
        uniform float clickStart;
        uniform float clickDuration;
        uniform float clickRadius;
        
        ${shader.fragmentShader}
      `.replace(
        `vec4 base = texture2D( tDiffuse, vUv );`,
        `
        
        vec2 uv = vUv;
        
        // <ripple>
        
          vec2 mouseUV = (uv - 0.5) * vec2(aspect, 1.);
          vec2 mouse = pointer * vec2(aspect, 1.) * 0.5;
          vec2 dir = normalize(mouseUV - mouse);

          float currentMoment = clamp((timeVal - clickStart) / clickDuration, 0., 1.);
          float distance = distance(mouseUV, mouse) - clickRadius * currentMoment;
          float waveWidth = 0.1;
          float wave = smoothstep(-waveWidth, 0., distance) - smoothstep(0., waveWidth, distance);
          float magnitude = smoothstep(0., 0.2, currentMoment) - smoothstep(0.2, 1., currentMoment);
          float waveMagnitude = wave * magnitude;
          vec2 uvRipple = dir * -0.05 * waveMagnitude;

          uv += uvRipple;
        
        // </ripple>
        
        vec4 base = texture2D( tDiffuse, uv );
        
        vec2 texUV = (uv - 0.5) * vec2(aspect, 2.) * 2. + vec2(0., 1.875);
        vec2 absTex = abs(texUV);
        float texLimit = 1. - step(0.5, max(absTex.x, absTex.y));
        texUV += 0.5;
        vec4 wordNoise = texture(textTexture, vec2(texUV.x, (texUV.y + 0.0) * 0.5));
        vec4 wordSolid = texture(textTexture, vec2(texUV.x, (texUV.y + 1.0) * 0.5));
        
        base = mix(base, wordNoise, wordNoise.a * texLimit * (1. - smoothstep(0.0, 0.5, transition)));
        base = mix(base, wordSolid, wordSolid.a * texLimit * smoothstep(0.5, 1.0, transition));
        
        base.rgb += vec3(.005) * waveMagnitude; // lightening the ripple

        `
      ).replace(
        `float noise = rand( fract( vUv + time ) );`,
        `
          float freq = 48.;
          float nTime = floor(time * freq) / freq;
          float noise = rand( fract( vUv + nTime ) );
          
        `
      );
      
      console.log(shader.fragmentShader)
    }
    this.addPass(renderPass);
    this.addPass(filmPass);
    this.addPass(new OutputPass());
  }
}

class Grid extends THREE.Mesh{
  constructor(gridSize = 32){
    super();
    this.uniforms = {
      state: {value: 0}
    }
    this.gridSize = gridSize;
    const ig = new THREE.InstancedBufferGeometry().copy(new THREE.BoxGeometry());
    ig.instanceCount = gridSize ** 3;
    const m = new THREE.MeshLambertMaterial({
      //metalness: 0.6,
      //roughness: 0.4,
      vertexColors: true,
      onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        shader.uniforms.state = this.uniforms.state;
        shader.uniforms.dpr = {value: devicePixelRatio};
        shader.vertexShader = `
          uniform float time;
          uniform float state;
          
          varying float vBaseVal;
          varying float vNoiseVal;
          varying float vFrame;
          
          ${noise}
          
          // https://www.shadertoy.com/view/3ljcRh
          float sdBoxFrame( vec3 p, vec3 b, float e)
          {
               p = abs(p  )-b;
               vec3 q = abs(p+e)-e;

               return min(min(
                   length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
                   length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
                   length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
           }

           mat4 rotationX( in float angle ) {
                return mat4(	1.0,		0,			0,			0,
                        0, 	cos(angle),	-sin(angle),		0,
                        0, 	sin(angle),	 cos(angle),		0,
                        0, 			0,			  0, 		1);
           }

           mat4 rotationY( in float angle ) {
             return mat4(	cos(angle),		0,		sin(angle),	0,
                        0,		1.0,			 0,	0,
                   -sin(angle),	0,		cos(angle),	0,
                        0, 		0,				0,	1);
           }

           mat4 rotationZ( in float angle ) {
             return mat4(	cos(angle),		-sin(angle),	0,	0,
             sin(angle),		cos(angle),		0,	0,
             0,				0,		1,	0,
             0,				0,		0,	1);
           }
           
           vec3 rot3d(vec3 rotation, vec3 vector){
                        return vec3(vec4(vector, 1.) * rotationX(rotation.x) * rotationY(rotation.y) * rotationZ(rotation.z));
           }
          
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          
          float t = time * 0.25;

          float gridSize = ${this.gridSize}.;
          float iID = floor(float(gl_InstanceID) + 0.1);
          
          float rowSize = ${gridSize}.;
          float layerSize = ${gridSize ** 2}.;
          
          vec3 center = vec3(${(gridSize - 1) * -.5});
          
          float iZ = floor(iID / layerSize);
          float rowRest = mod(iID, layerSize);
          float iY = floor(rowRest / rowSize);
          float iX = mod(rowRest, rowSize);
          
          vec3 iPos = vec3(iX, iY, iZ);
          
          float baseVal = 0.5;
          vBaseVal = baseVal;
          float visibilityRange = 0.1;
          float colorRange = clamp(0., visibilityRange, 0.05);
          
          
          float n = cnoise(vec4(iPos * 0.1, t));
          
          // <animation>
          
            // 0 - noise, 1 - solid
            float stateChange = state; 
            n = mix(n, 1., stateChange);
            
          // </animation>
          
          float nPlus = n * 0.5 + 0.5;
          vNoiseVal = nPlus;
          float nVal = smoothstep(baseVal - visibilityRange, baseVal + visibilityRange, nPlus);
          
          vec3 centeredPos = iPos + center;
          float centeredLen = length(centeredPos);
          
          // <inner hollowness>
          
            float maxR = ${this.gridSize * 0.5}.;
            float hollowVal = smoothstep(maxR * 0.6, maxR * 0.95, centeredLen);
            //hollowVal -= smoothstep(maxR * 0.95, maxR, centeredLen);
            nVal *= mix( hollowVal , 1., stateChange);
          
          // </inner hollowness>
          
          // <inner frame>
          
            vec3 frameRot = rot3d(vec3(0.25, 0, 0.25) + t * 2., centeredPos);
            float frameThickness = 0.025;
            float dFrame = sdBoxFrame(frameRot, vec3(maxR * 0.4), maxR * frameThickness);
            float frameSmoothness = 0.1;
            float fFrame = 1. - smoothstep(0., maxR * frameSmoothness, dFrame);
            vFrame = step(maxR * frameSmoothness, dFrame);
            nVal = max(nVal, fFrame);
          
          // </inner frame>
          
          transformed *= nVal;
          
          transformed += centeredPos * mix(1.5, 1., stateChange);
          transformed += normalize(centeredPos) * n * (maxR * 0.5) * (1. - stateChange) * vFrame; // wobbling
          
          vColor = mix(vec3(1, 0.1, 0), vec3(0.025), smoothstep(baseVal - colorRange, baseVal + colorRange, nPlus));
          vColor = mix(vColor, vec3(1, 0.25, 0), 1. - vFrame);
          
          vNoiseVal = mix(vNoiseVal, 0., fFrame);
          
          `
        );
        
        shader.fragmentShader = `
        
          uniform float dpr;
          
          varying float vBaseVal;
          varying float vNoiseVal;
          varying float vFrame;
          
          //https://madebyevan.com/shaders/grid/
          float getGrid (vec2 vertex){
              vec2 coord = vertex.xy;
              vec2 grid = (abs(fract(coord - 0.5) - 0.5) / fwidth(coord)) / (1.5 * dpr);
              float line = min(grid.x, grid.y);
              float color = 1.0 - min(line, 1.0);
              return color;
          }
          ${shader.fragmentShader}
        `.replace(
          `#include <tonemapping_fragment>`,
          `
          float grid = getGrid(vUv);
          
          vec3 col = gl_FragColor.rgb;
          float noiseFront = vNoiseVal - vBaseVal;
          float noiseFrontThick = 1. - smoothstep(0.05, 0.1, abs(noiseFront));
          col = mix(col, vec3(1, 0.05, 0.), grid * noiseFrontThick);
          
          gl_FragColor.rgb = col;
          
          gl_FragColor.rgb = vFrame < 0.5 ? vColor : gl_FragColor.rgb;
          
          #include <tonemapping_fragment>
          `
        );
      }
    });
    
    m.defines = {"USE_UV" : ""};
    
    this.geometry = ig;
    this.material = m;
    
    controls.enabled = false;
    
    this.stateAnimation = {
      duration: 30,
      transition01: {start: 0.1, end: 0.3},
      transition10: {start: 0.9, end: 1.0}
    }
    
    this.cameraAnimation = {
      cameraPosition: camera.position.clone(),
      axis: new THREE.Vector3(-0.5, 1, -0.5).normalize(),
    }
    
    const tweenDelay = this.stateAnimation.duration * this.stateAnimation.transition01.start;
    const tweenDuration = this.stateAnimation.duration * (1 - this.stateAnimation.transition01.start);
    console.log(tweenDelay, tweenDuration)
    new TWEEN.Tween({val: 0}).to({val: 1}, tweenDuration * 1000)
      .delay(tweenDelay * 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(val => {
        camera.position.copy(this.cameraAnimation.cameraPosition).applyAxisAngle(this.cameraAnimation.axis, Math.PI * 2 * val.val);
      })
      .onComplete(() => {controls.enabled = true;})
      .start();
  }
  
  update(t){
    const ani = this.stateAnimation;
    const aniVal = (t / ani.duration) % 1;
    const tr01 = ani.transition01;
    const tr10 = ani.transition10;
    
    this.uniforms.state.value = 1 - (mu.smoothstep(aniVal, tr01.start, tr01.end) - mu.smoothstep(aniVal, tr10.start, tr10.end));
    postprocessing.uniforms.transition.value = this.uniforms.state.value;
  }
}

const gu = {
  time: {
    value: 0
  },
  aspect: {
    value: innerWidth / innerHeight
  }
};
const dpr = Math.min(devicePixelRatio, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(-0.5, 0.5, 0.5).setLength(120);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const postprocessing = new Postprocessing(renderer, scene, camera);

window.addEventListener("resize", (event) => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth * dpr, innerHeight * dpr);
  postprocessing.setSize(innerWidth * dpr, innerHeight * dpr);
  gu.aspect.value = camera.aspect;
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.DirectionalLight(0xffffff, Math.PI * 1.75);
light.position.set(0.5, 1.75, 1).setLength(50);
scene.add(
  light,
  new THREE.AmbientLight(0xffffff, Math.PI * 0.25)
);

let grid = new Grid();
scene.add(grid);

const clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
  let dt = clock.getDelta();
  t += dt;
  gu.time.value = t;
  TWEEN.update();
  controls.update();
  grid.update(t);
  //renderer.render(scene, camera);
  postprocessing.render();
})
