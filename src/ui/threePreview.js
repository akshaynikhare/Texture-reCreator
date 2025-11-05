/**
 * Three.js 3D Preview Manager
 * Handles sphere and cloth previews with texture mapping
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
    this.camera.position.set(0, 2, 6); // Higher and further back to see table
    this.camera.lookAt(0, -0.5, 0); // Look slightly down

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls - allows dragging to rotate view
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooth movement
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.target.set(0, -0.5, 0); // Look at center of scene

    // Lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
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
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.5,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);
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

    // Remove all old table parts (top and legs)
    const objectsToRemove = this.scene.children.filter(
      child => child instanceof THREE.Mesh &&
      (child.geometry instanceof THREE.BoxGeometry ||
       child.geometry instanceof THREE.CylinderGeometry)
    );
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose());
      } else {
        obj.material.dispose();
      }
    });

    // Create beautiful white wooden table
    const tableWidth = 4;
    const tableDepth = 3;
    const tableHeight = 0.1;
    const legHeight = 1.5;
    const tableTopY = -0.3; // Position table top higher to be more visible

    // Table top - white wood with grain
    const tableTopGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableDepth);
    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f0, // Creamy white wood
      roughness: 0.8,
      metalness: 0.05,
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.y = tableTopY;
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    this.scene.add(tableTop);

    // Table legs - 4 corners, cylindrical wooden legs
    const legRadius = 0.06;
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0ead6, // Slightly darker wood for legs
      roughness: 0.8,
      metalness: 0.05,
    });

    const legInset = 0.25; // Distance from edge
    const legPositions = [
      { x: tableWidth / 2 - legInset, z: tableDepth / 2 - legInset },
      { x: -tableWidth / 2 + legInset, z: tableDepth / 2 - legInset },
      { x: tableWidth / 2 - legInset, z: -tableDepth / 2 + legInset },
      { x: -tableWidth / 2 + legInset, z: -tableDepth / 2 + legInset },
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial.clone());
      leg.position.set(pos.x, tableTopY - tableHeight / 2 - legHeight / 2, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.scene.add(leg);
    });

    // Create cloth plane with texture
    const clothWidth = 2.5;
    const clothHeight = 2.5;
    const segments = 40;

    const geometry = new THREE.PlaneGeometry(clothWidth, clothHeight, segments, segments);

    // Apply cloth-like deformation - draping over table
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Create gentle draping effect
      const distFromCenter = Math.sqrt(x * x + y * y);
      const sag = Math.pow(distFromCenter / 1.5, 2) * 0.15;
      positions.setZ(i, -sag);

      // Add subtle wrinkles and folds
      const wrinkle1 = Math.sin(x * 4) * Math.cos(y * 4) * 0.03;
      const wrinkle2 = Math.sin(x * 7 + y * 5) * 0.02;
      positions.setZ(i, positions.getZ(i) + wrinkle1 + wrinkle2);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    // Position cloth just above table surface
    this.mesh.position.y = tableTopY + tableHeight / 2 + 0.05;
    this.mesh.rotation.x = -Math.PI / 2.5; // Tilt for better view
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.currentMode = 'cloth';
  }

  updateTexture(dataURL) {
    const loader = new THREE.TextureLoader();

    loader.load(dataURL, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);

      if (this.texture) {
        this.texture.dispose();
      }

      this.texture = texture;

      // Update or create mesh based on current mode
      if (this.currentMode === 'sphere') {
        this.createSphere();
      } else if (this.currentMode === 'cloth') {
        this.createCloth();
      }
    });
  }

  setMode(mode) {
    this.currentMode = mode;

    // Clear table parts if switching from cloth mode
    if (mode !== 'cloth') {
      const objectsToRemove = this.scene.children.filter(
        child => child instanceof THREE.Mesh &&
        (child.geometry instanceof THREE.BoxGeometry ||
         child.geometry instanceof THREE.CylinderGeometry)
      );
      objectsToRemove.forEach(obj => {
        this.scene.remove(obj);
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      });
    }

    if (mode === 'sphere') {
      this.createSphere();
    } else if (mode === 'cloth') {
      this.createCloth();
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
