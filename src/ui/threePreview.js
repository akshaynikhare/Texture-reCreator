/**
 * Three.js 3D Preview Manager
 * Handles sphere, cube, and wall previews with texture mapping
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class ThreePreview {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.texture = null;
    this.animationId = null;
    this.currentMode = 'sphere';

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f7fa);

    // Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(8, 5, 8); // Position to see both walls of L-shape clearly
    this.camera.lookAt(-2, 2, -1); // Look at the corner intersection

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Preserve true texture colors by using sRGB output and disabling tone mapping
    if (this.renderer.outputColorSpace !== undefined) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls - allows dragging to rotate view
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooth movement
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.target.set(-2, 2, -1); // Look at the corner intersection

    // Lighting
    this.setupLighting();

  // Try to load a studio environment/background if present in the repo
  // Drop a file at 'assets/env/studio.hdr' (preferred) or 'assets/env/studio.jpg' to enable.
  this.loadEnvironmentIfAvailable();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  loadEnvironmentIfAvailable() {
    const tryHdr = 'assets/env/studio.hdr';
    const tryJpg = 'assets/env/studio.jpg';

    // Helper to set environment from a loaded texture (HDR or JPG)
    const applyEnvFromTexture = (tex, isHDR = false) => {
      try {
        // Create PMREM for physically based lighting
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();

        // Ensure equirectangular mapping for background display
        tex.mapping = THREE.EquirectangularReflectionMapping;

        const envMap = pmrem.fromEquirectangular(tex).texture;
        this.scene.environment = envMap; // for reflections
        this.scene.background = tex; // visible studio background

        pmrem.dispose();
      } catch (e) {
        // Fallback – keep solid background color on any error
        console.warn('Env map setup failed, falling back to color background:', e);
      }
    };

    // Attempt HDR first
    new RGBELoader().load(
      tryHdr,
      (hdrTex) => applyEnvFromTexture(hdrTex, true),
      undefined,
      // On HDR error, try JPG/PNG
      () => {
        new THREE.TextureLoader().load(
          tryJpg,
          (ldrTex) => applyEnvFromTexture(ldrTex, false),
          undefined,
          // If JPG missing too, silently keep default color
          () => {}
        );
      }
    );
  }

  setupLighting() {
    // Ambient light (slightly reduced for softer illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambientLight);

    // Main directional light (reduce intensity)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.55);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Fill light (reduced)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);

    // Rim light (reduced)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.12);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);
  }

  createSphere() {
    // Remove existing mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    // Create sphere geometry
    const geometrySphere = new THREE.SphereGeometry(1.5, 64, 64);
    const materialSphere = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.65,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });
    this.mesh = new THREE.Mesh(geometrySphere, materialSphere);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.currentMode = 'sphere';
  }

  createCloth() {
    // Remove existing mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    // Remove old walls if they exist
    const oldWalls = this.scene.children.filter(
      child => child.name && child.name.startsWith('wall')
    );
    oldWalls.forEach(wall => {
      this.scene.remove(wall);
      if (wall.geometry) wall.geometry.dispose();
      // Some walls use an array of materials – dispose them safely
      if (wall.material) {
        if (Array.isArray(wall.material)) {
          wall.material.forEach(mat => {
            if (mat && typeof mat.dispose === 'function') {
              mat.dispose();
            }
          });
        } else if (typeof wall.material.dispose === 'function') {
          wall.material.dispose();
        }
      }
    });

    // Create L-shaped wall with exact specifications
    // Convert mm to Three.js units (1 unit = 100mm for better scale)
    const wallLongSide = 8;    // 1000mm
    const wallShortSide = 4;    // 400mm
    const wallHeight = 4;       // 900mm
    const wallThickness = 0.5 ;    // 100mm
    const skirtingHeight = 0.5;

    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });

    // White material for wall edges and skirting
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
      metalness: 0.0,
    });

    // Wall 1 - Long side (1000mm length) - horizontal back wall
    const wall1Geometry = new THREE.BoxGeometry(wallLongSide, wallHeight, wallThickness);
    const wall1 = new THREE.Mesh(wall1Geometry, [
      material, // right side
      material, // left side
      whiteMaterial, // top
      whiteMaterial, // bottom
      material,      // front face (textured - facing into room)
      material       // back face also textured so it shows from oblique angles
    ]);
  // Slightly pull wall1 back so the side wall does not visually overlap at the corner
  wall1.position.set(0, 0, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    wall1.name = 'wall1';
    this.scene.add(wall1);

    // Wall 2 - Short side (400mm length), perpendicular forming L
    const wall2Geometry = new THREE.BoxGeometry(wallThickness, wallHeight/2, wallShortSide);
    const wall2 = new THREE.Mesh(wall2Geometry, [
      material,      // right face (textured - facing into room)
      material,      // left face also textured for better coverage
      material, // top
      material, // bottom
      material, // front face
      material  // back face
    ]);
    // Position at the left end of wall1 to form L, with a tiny offset so edges don't overlap
    wall2.position.set(
     0, 
      0, 
      0
    );
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    wall2.name = 'wall2';
    this.scene.add(wall2);

    // Add skirting boards
    this.addSkirting(wallLongSide, wallThickness, skirtingHeight, whiteMaterial);

    // Add simple white chair for reference
    this.addChair();

    // Add ground plane for better depth perception
    this.addGround();

    this.currentMode = 'cloth';
  }

  addChair() {
    // Remove old chair if exists
    const oldChair = this.scene.getObjectByName('referenceChair');
    if (oldChair) {
      this.scene.remove(oldChair);
      oldChair.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    const chairGroup = new THREE.Group();
    chairGroup.name = 'referenceChair';
    
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.7,
      metalness: 0.1,
    });

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seat = new THREE.Mesh(seatGeometry, whiteMaterial);
    seat.position.y = -0.8;
    chairGroup.add(seat);

    // Backrest
    const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.05);
    const back = new THREE.Mesh(backGeometry, whiteMaterial);
    back.position.set(0, -0.5, -0.225);
    chairGroup.add(back);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const legPositions = [
      { x: 0.2, z: 0.2 },
      { x: -0.2, z: 0.2 },
      { x: 0.2, z: -0.2 },
      { x: -0.2, z: -0.2 },
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, whiteMaterial);
      leg.position.set(pos.x, -1.05, pos.z);
      chairGroup.add(leg);
    });

    // Position chair in front of the corner, angled nicely
    chairGroup.position.set(0.5, 0, -0.5);
    chairGroup.rotation.y = Math.PI / 6;  // Slight angle for better view
    chairGroup.castShadow = true;
    chairGroup.receiveShadow = true;
    this.scene.add(chairGroup);
  }

  addSkirting(wallLongSide, wallThickness, skirtingHeight, whiteMaterial) {
    // Remove old skirting if exists
    const oldSkirtings = this.scene.children.filter(
      child => child.name && child.name.startsWith('skirting')
    );
    oldSkirtings.forEach(skirting => {
      this.scene.remove(skirting);
      if (skirting.geometry) skirting.geometry.dispose();
      if (skirting.material) skirting.material.dispose();
    });

    const wallShortSide = 4;  // 400mm
    const skirtingDepth = 0.08;
    const skirtingY = -2 + skirtingHeight / 2;

    // Skirting for long wall (1000mm) - along the back wall
    const skirting1Geometry = new THREE.BoxGeometry(wallLongSide, skirtingHeight, skirtingDepth);
    const skirting1 = new THREE.Mesh(skirting1Geometry, whiteMaterial.clone());
    skirting1.position.set(
      0, 
      skirtingY, 
      0 + skirtingDepth / 2
    );
    skirting1.castShadow = true;
    skirting1.receiveShadow = true;
    skirting1.name = 'skirting1';
    this.scene.add(skirting1);

    // Skirting for short wall (400mm) - along the side wall
    const skirting2Geometry = new THREE.BoxGeometry(skirtingDepth, skirtingHeight, wallShortSide);
    const skirting2 = new THREE.Mesh(skirting2Geometry, whiteMaterial.clone());
    skirting2.position.set(
      0, 
      0, 
      0
    );
    skirting2.castShadow = true;
    skirting2.receiveShadow = true;
    skirting2.name = 'skirting2';
    this.scene.add(skirting2);

    // Corner piece for skirting (where two skirtings meet)
    const cornerSkirtingGeometry = new THREE.BoxGeometry(skirtingDepth, skirtingHeight, skirtingDepth);
    const cornerSkirting = new THREE.Mesh(cornerSkirtingGeometry, whiteMaterial.clone());
    cornerSkirting.position.set(
      -wallLongSide / 2 + skirtingDepth / 2,
      skirtingY,
      0 + skirtingDepth / 2
    );
    cornerSkirting.castShadow = true;
    cornerSkirting.receiveShadow = true;
    cornerSkirting.name = 'skirtingCorner';
    this.scene.add(cornerSkirting);
  }

  addGround() {
    // Remove old ground if exists
    const oldGround = this.scene.getObjectByName('ground');
    if (oldGround) {
      this.scene.remove(oldGround);
      if (oldGround.geometry) oldGround.geometry.dispose();
      if (oldGround.material) oldGround.material.dispose();
    }

    // Create simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.9,
      metalness: 0.0,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);
  }

  createCube() {
    // Remove existing mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    // Remove chair if exists
    const oldChair = this.scene.getObjectByName('referenceChair');
    if (oldChair) {
      this.scene.remove(oldChair);
    }

    // Create cube geometry
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.7,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.currentMode = 'cube';
  }

  updateTexture(dataURL) {
    const loader = new THREE.TextureLoader();
    loader.load(dataURL, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      // Use stronger tiling on wall mode so patterns are easier to see on large geometry
      if (this.currentMode === 'cloth') {
        texture.repeat.set(4, 4);
      } else {
        texture.repeat.set(2, 2);
      }
      // Ensure texture uses sRGB color space for accurate color display
      if (texture.colorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      if (this.texture) {
        this.texture.dispose();
      }
      this.texture = texture;
      if (this.currentMode === 'sphere') {
        this.createSphere();
      } else if (this.currentMode === 'cloth') {
        this.createCloth();
      } else if (this.currentMode === 'cube') {
        this.createCube();
      }
    });
  }

  setMode(mode) {
    this.currentMode = mode;

    // Remove chair, walls, and ground if switching away from cloth mode
    if (mode !== 'cloth') {
      const oldChair = this.scene.getObjectByName('referenceChair');
      if (oldChair) {
        this.scene.remove(oldChair);
        oldChair.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }

      const oldGround = this.scene.getObjectByName('ground');
      if (oldGround) {
        this.scene.remove(oldGround);
        if (oldGround.geometry) oldGround.geometry.dispose();
        if (oldGround.material) oldGround.material.dispose();
      }

      const oldWalls = this.scene.children.filter(
        child => child.name && child.name.startsWith('wall')
      );
      oldWalls.forEach(wall => {
        this.scene.remove(wall);
        if (wall.geometry) wall.geometry.dispose();
        if (wall.material) {
          if (Array.isArray(wall.material)) {
            wall.material.forEach(mat => {
              if (mat && typeof mat.dispose === 'function') {
                mat.dispose();
              }
            });
          } else if (typeof wall.material.dispose === 'function') {
            wall.material.dispose();
          }
        }
      });

      const oldSkirtings = this.scene.children.filter(
        child => child.name && child.name.startsWith('skirting')
      );
      oldSkirtings.forEach(skirting => {
        this.scene.remove(skirting);
        if (skirting.geometry) skirting.geometry.dispose();
        if (skirting.material) skirting.material.dispose();
      });
    }

    if (mode === 'sphere') {
      this.createSphere();
    } else if (mode === 'cloth') {
      this.createCloth();

      // After creating the L-shaped wall, adjust camera framing
      if (this.camera && this.controls) {
        // Position camera so both wall segments and chair are clearly visible
        this.camera.position.set(6, 4, 6);
        this.controls.target.set(-1.5, 2, -1);
        this.camera.lookAt(this.controls.target);
        this.controls.update();
      }
    } else if (mode === 'cube') {
      this.createCube();
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Update orbit controls (for smooth damping)
    if (this.controls) {
      this.controls.update();
    }

    // No auto-rotation - user can drag to rotate

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    if (this.texture) {
      this.texture.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    window.removeEventListener('resize', () => this.onWindowResize());
  }
}
