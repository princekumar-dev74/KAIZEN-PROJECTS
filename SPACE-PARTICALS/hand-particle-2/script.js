        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

        const config = {
            count: 50000,
            bloomStrength: 0.8, // Reduced default brightness
            color1: new THREE.Color('#ff5500'), // Default Orange
            color2: new THREE.Color('#0088ff'), // Default Blue
        };

        let scene, camera, renderer, composer, bloomPass;
        let particles, material;
        let blackHoleSphere;
        let handLandmarker, video = document.getElementById('webcam-pip');
        let lastVideoTime = -1;
        let clock = new THREE.Clock();

        const gesture = {
            active: false,
            rotX: 0, rotY: 0,
            tension: 0.5,
            sRotX: 0, sRotY: 0, sTension: 0.5
        };

        async function init() {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x000000, 0.002);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
            camera.position.z = 45;
            camera.position.y = 10;

            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            // Post Processing (Bloom)
            const renderPass = new RenderPass(scene, camera);
            bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.05;
            bloomPass.strength = config.bloomStrength;
            bloomPass.radius = 0.8;

            composer = new EffectComposer(renderer);
            composer.addPass(renderPass);
            composer.addPass(bloomPass);

            createObjects();
            setupUI();

            try {
                await initVision();
                document.getElementById('loader').style.opacity = 0;
                setTimeout(() => document.getElementById('loader').remove(), 500);
            } catch (e) {
                console.warn(e);
                fallbackMouse();
                document.getElementById('loader').remove();
            }

            window.addEventListener('resize', onResize);
            animate();
        }

        function createObjects() {
            // Stars
            const starGeo = new THREE.BufferGeometry();
            const sPos = new Float32Array(3000 * 3);
            for (let i = 0; i < 3000 * 3; i++) sPos[i] = (Math.random() - 0.5) * 600;
            starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
            const starMat = new THREE.PointsMaterial({ color: 0x666666, size: 0.5, transparent: true });
            scene.add(new THREE.Points(starGeo, starMat));

            // Black Hole Void
            blackHoleSphere = new THREE.Mesh(
                new THREE.SphereGeometry(6, 64, 64),
                new THREE.MeshBasicMaterial({ color: 0x000000 })
            );
            scene.add(blackHoleSphere);

            // Particles
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(config.count * 3);
            const randoms = new Float32Array(config.count);
            const sizes = new Float32Array(config.count);
            const initialAngles = new Float32Array(config.count); // To mix colors

            for (let i = 0; i < config.count; i++) {
                const isHalo = Math.random() > 0.8;
                let r, theta, x, y, z;

                if (!isHalo) {
                    // Disk
                    r = 7 + Math.pow(Math.random(), 2) * 25;
                    theta = Math.random() * Math.PI * 2;
                    x = r * Math.cos(theta);
                    z = r * Math.sin(theta);
                    y = (Math.random() - 0.5) * (1.0 + (25 / r));
                } else {
                    // Halo
                    r = 7.5 + Math.random() * 2;
                    theta = Math.random() * Math.PI * 2;
                    const phi = (Math.random() - 0.5) * Math.PI * 0.8;
                    x = r * Math.cos(theta) * Math.cos(phi);
                    y = r * Math.sin(theta);
                    z = r * Math.cos(theta) * Math.sin(phi);
                }

                pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
                randoms[i] = Math.random();
                sizes[i] = Math.random();
                initialAngles[i] = Math.atan2(z, x); // Save angle for color mixing
            }

            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            geo.setAttribute('aAngle', new THREE.BufferAttribute(initialAngles, 1));

            material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uTension: { value: 0.5 },
                    uColor1: { value: config.color1 },
                    uColor2: { value: config.color2 },
                    uBrightness: { value: 1.0 } // Uniform for shader brightness logic
                },
                vertexShader: `
                    uniform float uTime;
                    uniform float uTension;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;

                    attribute float aRandom;
                    attribute float aSize;
                    attribute float aAngle;
                    
                    varying vec3 vColor;

                    void main() {
                        vec3 pos = position;
                        float r = length(pos.xz);
                        
                        // Vortex Spin
                        float speed = (80.0 / (r * r + 1.0)) * 0.5;
                        float gSpeed = 1.0 + (1.0 - uTension) * 3.0;
                        float ang = uTime * speed * gSpeed;
                        
                        float c = cos(ang); float s = sin(ang);
                        float nx = pos.x * c - pos.z * s;
                        float nz = pos.x * s + pos.z * c;
                        pos.x = nx; pos.z = nz;

                        // Expansion/Suction
                        float scale = 0.5 + uTension; 
                        if(uTension < 0.3) {
                             float suck = (0.3 - uTension) * 2.0;
                             pos = mix(pos, vec3(0.0), suck * 0.5);
                             scale = 0.8;
                        }
                        pos *= scale;

                        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
                        gl_Position = projectionMatrix * mv;
                        gl_PointSize = (3.0 * aSize * scale) * (200.0 / -mv.z);

                        // Color Mixing Logic in Vertex Shader for performance
                        // Use the original angle + some offset to mix colors
                        float mixFactor = sin(aAngle + 1.0); 
                        
                        // Hot core
                        vec3 finalColor;
                        if(r < 8.0) {
                            finalColor = vec3(1.0, 1.0, 1.0); // White core
                        } else {
                            finalColor = mix(uColor2, uColor1, smoothstep(-0.5, 0.5, mixFactor));
                        }
                        vColor = finalColor;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        vec2 xy = gl_PointCoord.xy - vec2(0.5);
                        float d = length(xy);
                        if(d > 0.5) discard;
                        
                        // Glow calculation
                        float glow = 1.0 - (d * 2.0);
                        glow = pow(glow, 2.5);
                        
                        gl_FragColor = vec4(vColor, glow);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            particles = new THREE.Points(geo, material);
            scene.add(particles);
        }

        // --- Vision ---
        async function initVision() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = stream;
            video.addEventListener('loadeddata', predict);
        }

        async function predict() {
            if (video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const result = handLandmarker.detectForVideo(video, performance.now());
                if (result.landmarks.length > 0) {
                    const lm = result.landmarks[0];
                    document.getElementById('cam-dot').classList.add('active');
                    document.getElementById('status-text').innerText = "Linked";

                    // Rotation
                    gesture.rotY = (lm[9].x - 0.5) * Math.PI * 4;
                    gesture.rotX = (lm[9].y - 0.5) * Math.PI * 2;

                    // Tension
                    const palm = Math.hypot(lm[0].x - lm[5].x, lm[0].y - lm[5].y);
                    const tip = Math.hypot(lm[0].x - lm[8].x, lm[0].y - lm[8].y);
                    let t = (tip / palm - 0.6) / 1.6;
                    gesture.tension = Math.max(0, Math.min(1, t));
                } else {
                    document.getElementById('cam-dot').classList.remove('active');
                    document.getElementById('status-text').innerText = "Searching...";
                }
            }
            requestAnimationFrame(predict);
        }

        function fallbackMouse() {
            document.getElementById('status-text').innerText = "Mouse Mode";
            document.addEventListener('mousemove', (e) => {
                gesture.rotY = (e.clientX / window.innerWidth - 0.5) * Math.PI * 4;
                gesture.rotX = (e.clientY / window.innerHeight - 0.5) * Math.PI * 2;
            });
            document.addEventListener('mousedown', () => gesture.tension = 0);
            document.addEventListener('mouseup', () => gesture.tension = 1);
        }

        // --- UI & Controls ---
        function setupUI() {
            // Brightness
            document.getElementById('sl-bright').addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                bloomPass.strength = val;
                document.getElementById('val-bright').innerText = Math.round(val * 100) + '%';
            });

            // Colors
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelector('.theme-btn.active').classList.remove('active');
                    btn.classList.add('active');

                    const c1 = new THREE.Color(btn.dataset.c1);
                    const c2 = new THREE.Color(btn.dataset.c2);

                    // Update Shader Uniforms
                    material.uniforms.uColor1.value = c1;
                    material.uniforms.uColor2.value = c2;
                });
            });
        }

        function animate() {
            requestAnimationFrame(animate);
            const dt = clock.getDelta();

            gesture.sRotX += (gesture.rotX - gesture.sRotX) * 0.08;
            gesture.sRotY += (gesture.rotY - gesture.sRotY) * 0.08;
            gesture.sTension += (gesture.tension - gesture.sTension) * 0.1;

            if (particles) {
                particles.rotation.x = gesture.sRotX * 0.5 + 0.3;
                particles.rotation.y = gesture.sRotY;
                particles.rotation.z = gesture.sRotX * 0.2;
                blackHoleSphere.rotation.copy(particles.rotation);

                material.uniforms.uTime.value += dt;
                material.uniforms.uTension.value = gesture.sTension;
            }

            composer.render();
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }

        init();