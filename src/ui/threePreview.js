/**
 * Three.js 3D Preview Manager
 * Handles sphere and cloth previews with texture mapping
 */

import * as THREE from 'three';

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
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

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

    // Create table
    const tableGeometry = new THREE.BoxGeometry(4, 0.1, 3);
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.2,
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -1.5;
    table.receiveShadow = true;
    this.scene.add(table);

    // Create cloth plane
    const clothWidth = 3;
    const clothHeight = 3;
    const segments = 32;

    const geometry = new THREE.PlaneGeometry(clothWidth, clothHeight, segments, segments);

    // Apply cloth-like deformation
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Create draping effect
      const distFromCenter = Math.sqrt(x * x + y * y);
      const sag = Math.pow(distFromCenter / 2, 2) * 0.3;
      positions.setZ(i, -sag);

      // Add some wrinkles
      const wrinkle = Math.sin(x * 3) * Math.cos(y * 3) * 0.05;
      positions.setZ(i, positions.getZ(i) + wrinkle);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = -0.5;
    this.mesh.rotation.x = -Math.PI / 6;
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

    // Clear table if switching from cloth mode
    if (mode !== 'cloth') {
      const table = this.scene.children.find(
        child => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry
      );
      if (table) {
        this.scene.remove(table);
        table.geometry.dispose();
        table.material.dispose();
      }
    }

    if (mode === 'sphere') {
      this.createSphere();
    } else if (mode === 'cloth') {
      this.createCloth();
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate the object
    if (this.mesh) {
      if (this.currentMode === 'sphere') {
        this.mesh.rotation.y += 0.005;
      } else if (this.currentMode === 'cloth') {
        // Slight rotation for cloth
        this.mesh.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
      }
    }

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
