        // Initialize Icons
        lucide.createIcons();

        // Application Logic
        class ParticleApp {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.particles = null;
                this.count = 8000; // Number of particles
                this.positions = []; // Store base positions for shapes
                this.currentPositions = null; // Actual rendering positions
                this.targetColor = new THREE.Color(0xff3366);
                this.handOpenness = 0; // 0 = closed, 1 = open
                this.handPosition = { x: 0, y: 0 };
                this.currentTemplate = 'hearts';
                this.clock = new THREE.Clock();
                this.time = 0;
                this.mouse = new THREE.Vector2();
                this.isHandsDetected = false;

                this.initThree();
                this.initParticles();
                this.initMediaPipe();
                this.animate();
                this.setupResize();
            }

            // --- 1. Three.js Setup ---
            initThree() {
                const container = document.getElementById('canvas-container');
                
                this.scene = new THREE.Scene();
                this.scene.fog = new THREE.FogExp2(0x050505, 0.002);

                this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.camera.position.z = 30;

                this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(this.renderer.domElement);

                // Lighting (Ambient + Point)
                const ambientLight = new THREE.AmbientLight(0x404040);
                this.scene.add(ambientLight);
                
                // Add a mouse listener for fallback interaction
                window.addEventListener('mousemove', (e) => {
                    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                });
            }

            // --- 2. Particle System ---
            createTexture() {
                // Procedurally create a glow texture
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const context = canvas.getContext('2d');
                const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
                gradient.addColorStop(0, 'rgba(255,255,255,1)');
                gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
                gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                context.fillStyle = gradient;
                context.fillRect(0, 0, 32, 32);
                const texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                return texture;
            }

            initParticles() {
                const geometry = new THREE.BufferGeometry();
                const posArray = new Float32Array(this.count * 3);
                
                // Colors array
                const colors = new Float32Array(this.count * 3);

                for(let i = 0; i < this.count * 3; i++) {
                    posArray[i] = (Math.random() - 0.5) * 50;
                    colors[i] = 1;
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                const material = new THREE.PointsMaterial({
                    size: 0.3,
                    map: this.createTexture(),
                    transparent: true,
                    opacity: 0.8,
                    vertexColors: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                this.particles = new THREE.Points(geometry, material);
                this.scene.add(this.particles);

                // Store base geometry references
                this.currentPositions = this.particles.geometry.attributes.position.array;
                
                // Initialize with first shape
                this.generateShape('hearts');
            }

            // --- 3. Shape Mathematics ---
            generateShape(type) {
                this.positions = new Float32Array(this.count * 3);
                
                for (let i = 0; i < this.count; i++) {
                    const i3 = i * 3;
                    let x, y, z;

                    if (type === 'hearts') {
                        // 3D Heart Approximation
                        const t = Math.random() * Math.PI * 2;
                        const u = Math.random() * Math.PI; 
                        const r = 10 * Math.sqrt(Math.random()); // Volume filling
                        
                        // Parametric heart equations
                        x = r * 16 * Math.pow(Math.sin(t), 3);
                        y = r * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                        // Z depth based on heart curve to make it puffy
                        z = (Math.random() - 0.5) * r * 5; 
                        
                        // Scale down
                        x *= 0.05; y *= 0.05; z *= 0.05;

                    } else if (type === 'saturn') {
                        const rnd = Math.random();
                        if (rnd > 0.3) {
                            // Ring
                            const angle = Math.random() * Math.PI * 2;
                            const radius = 8 + Math.random() * 4;
                            x = Math.cos(angle) * radius;
                            z = Math.sin(angle) * radius;
                            y = (Math.random() - 0.5) * 0.2; // Thin disk
                        } else {
                            // Planet Sphere
                            const theta = Math.random() * Math.PI * 2;
                            const phi = Math.acos(2 * Math.random() - 1);
                            const r = 4;
                            x = r * Math.sin(phi) * Math.cos(theta);
                            y = r * Math.sin(phi) * Math.sin(theta);
                            z = r * Math.cos(phi);
                        }
                    } else if (type === 'flowers') {
                        // Phyllotaxis (Golden Angle)
                        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
                        const r = 0.3 * Math.sqrt(i);
                        const theta = i * goldenAngle;
                        
                        // Create a bowl/flower shape
                        x = r * Math.cos(theta);
                        z = r * Math.sin(theta);
                        y = Math.sqrt(r) * 1.5 - 5; 

                    } else if (type === 'fireworks') {
                        // Sphere cloud
                        const r = 15 * Math.cbrt(Math.random());
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.acos(2 * Math.random() - 1);
                        
                        x = r * Math.sin(phi) * Math.cos(theta);
                        y = r * Math.sin(phi) * Math.sin(theta);
                        z = r * Math.cos(phi);
                    }

                    this.positions[i3] = x;
                    this.positions[i3 + 1] = y;
                    this.positions[i3 + 2] = z;
                }
            }

            setTemplate(type) {
                this.currentTemplate = type;
                this.generateShape(type);
                
                // UI Update
                document.querySelectorAll('.btn-option').forEach(btn => btn.classList.remove('active', 'border-white/40', 'bg-white/20'));
                const btn = document.querySelector(`button[onclick="app.setTemplate('${type}')"]`);
                if(btn) btn.classList.add('active', 'border-white/40', 'bg-white/20');
            }

            setColor(hex) {
                this.targetColor.setHex(hex);
            }

            // --- 4. Animation Loop ---
            animate() {
                requestAnimationFrame(() => this.animate());
                
                this.time += 0.01;
                const delta = this.clock.getDelta();

                // Determine interaction factor
                // If hands detected, use handOpenness. Else pulse automatically.
                let factor = 1;
                
                if (this.isHandsDetected) {
                    // Smooth lerp hand openness
                    factor = 0.5 + (this.handOpenness * 2.5); // Range 0.5 to 3.0
                } else {
                    // Auto breathe if no hands
                    factor = 1 + Math.sin(this.time * 2) * 0.3;
                }

                // Update particles
                const positions = this.particles.geometry.attributes.position.array;
                const colors = this.particles.geometry.attributes.color.array;

                for(let i = 0; i < this.count; i++) {
                    const i3 = i * 3;

                    // Get Target
                    const tx = this.positions[i3];
                    const ty = this.positions[i3+1];
                    const tz = this.positions[i3+2];

                    // Explosion/Expansion logic based on hand
                    // If Fireworks, we add some chaos
                    let expansion = factor;
                    if (this.currentTemplate === 'fireworks') {
                        expansion = factor * (1 + Math.sin(this.time + i * 0.01) * 0.2);
                    }

                    // Lerp current position to target position * expansion
                    // We add a little noise based on time for "alive" feel
                    positions[i3] += ((tx * expansion) - positions[i3]) * 0.1;
                    positions[i3+1] += ((ty * expansion) - positions[i3+1]) * 0.1;
                    positions[i3+2] += ((tz * expansion) - positions[i3+2]) * 0.1;

                    // Color interpolation
                    colors[i3] += (this.targetColor.r - colors[i3]) * 0.05;
                    colors[i3+1] += (this.targetColor.g - colors[i3+1]) * 0.05;
                    colors[i3+2] += (this.targetColor.b - colors[i3+2]) * 0.05;
                }

                this.particles.geometry.attributes.position.needsUpdate = true;
                this.particles.geometry.attributes.color.needsUpdate = true;

                // Rotate entire system based on hand X position (or mouse)
                let targetRotY = this.isHandsDetected ? (this.handPosition.x - 0.5) * 2 : this.mouse.x;
                let targetRotX = this.isHandsDetected ? (this.handPosition.y - 0.5) * 2 : this.mouse.y;
                
                this.particles.rotation.y += (targetRotY - this.particles.rotation.y) * 0.05;
                this.particles.rotation.x += (targetRotX - this.particles.rotation.x) * 0.05;
                
                // Constant slow spin
                this.particles.rotation.z += 0.002;

                this.renderer.render(this.scene, this.camera);
            }

            setupResize() {
                window.addEventListener('resize', () => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                });
            }

            // --- 5. MediaPipe Integration ---
            initMediaPipe() {
                const videoElement = document.getElementById('video-input');
                const canvasElement = document.getElementById('camera-feed');
                const canvasCtx = canvasElement.getContext('2d');

                const hands = new Hands({locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }});

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                hands.onResults((results) => {
                    // Draw Debug View
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                    
                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        const landmarks = results.multiHandLandmarks[0];
                        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
                        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
                        
                        this.processHandData(landmarks);
                        
                        // Update UI Status
                        this.isHandsDetected = true;
                        document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                        document.getElementById('status-text').innerText = "Hand Connected";
                    } else {
                        this.isHandsDetected = false;
                        document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
                        document.getElementById('status-text').innerText = "Waiting for hands...";
                    }
                    canvasCtx.restore();
                });

                const camera = new Camera(videoElement, {
                    onFrame: async () => {
                        await hands.send({image: videoElement});
                    },
                    width: 640,
                    height: 480
                });

                camera.start()
                    .then(() => {
                        document.getElementById('loading-screen').style.opacity = '0';
                        setTimeout(() => {
                            document.getElementById('loading-screen').style.display = 'none';
                        }, 1000);
                    })
                    .catch(err => {
                        console.error(err);
                        alert("Camera access denied or not available. Mouse fallback enabled.");
                        document.getElementById('loading-screen').style.display = 'none';
                    });
            }

            processHandData(landmarks) {
                // Calculate "Openness"
                // Distance between Wrist (0) and Middle Finger Tip (12)
                const wrist = landmarks[0];
                const tip = landmarks[12];
                const thumbTip = landmarks[4];
                const pinkyTip = landmarks[20];
                
                // Euclidean distance for vertical size (Open vs Closed fist)
                const distanceY = Math.sqrt(
                    Math.pow(tip.x - wrist.x, 2) + 
                    Math.pow(tip.y - wrist.y, 2)
                );

                // Euclidean distance for width (Spread)
                const distanceX = Math.sqrt(
                    Math.pow(thumbTip.x - pinkyTip.x, 2) + 
                    Math.pow(thumbTip.y - pinkyTip.y, 2)
                );
                
                // Normalize roughly. 
                // Closed fist usually ~0.1 to 0.2
                // Open hand usually ~0.5 to 0.7
                // We map this to 0-1
                let openness = (distanceY - 0.2) * 2.5; 
                openness = Math.max(0, Math.min(1, openness)); // Clamp

                this.handOpenness = openness;

                // Update Hand Position for Rotation
                // MediaPipe coords are 0-1. 
                this.handPosition = { x: wrist.x, y: wrist.y };
            }
        }

        // Start App
        const app = new ParticleApp();
