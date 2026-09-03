import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

@Component({
  selector: 'app-goiaba-3d-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full flex items-center justify-center bg-container">
      <canvas #threeCanvas class="max-w-full max-h-full"></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .bg-container {
      background-image: url('/assets/goiaba-psidium-guajava-1_3nd.webp');
      width: 250px;
      height: 250px;
      position: relative;
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class Goiaba3DBannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId?: number;

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    // Run Three.js initialization outside Angular zone to avoid triggering change detection
    this.ngZone.runOutsideAngular(() => {
      this.initThreeScene();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private async initThreeScene(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(250, 250);
    this.renderer.setClearColor(0x000000, 0.0);

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 1, 500);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(5, -2, 0);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(5, -2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = false;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;

    // Add lighting for the 3D sphere
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Create the G letter geometry
    this.createGLetter();

    // Load font and create OIABA text
    await this.createOiabaText();

    // Start animation loop
    this.animate();
  }

  private createGLetter(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    // Create points for letter "G"
    const points: THREE.Vector3[] = [];
    const outerRadius = 8;
    const innerRadius = 5;
    const centerX = 0;
    const centerY = 0;

    // Outer arc of G (C-shape) - start from top-right, go counter-clockwise
    for (let angle = 45; angle <= 315; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      points.push(new THREE.Vector3(
        centerX + Math.cos(rad) * outerRadius,
        centerY + Math.sin(rad) * outerRadius,
        0
      ));
    }

    // Inner horizontal bar - from opening back toward center
    const barY = 0;
    for (let i = 0; i <= 10; i++) {
      const x = outerRadius - (i / 10) * (outerRadius - innerRadius * 0.3);
      points.push(new THREE.Vector3(centerX + x, barY, 0));
    }

    const spline = new THREE.CatmullRomCurve3(points);
    const divisions = Math.round(12 * points.length);
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0, l = divisions; i < l; i++) {
      const t = i / l;
      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);
      color.setHSL(t, 1.0, 0.65, THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
    }

    // Create Line2 with LineGeometry and LineMaterial
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const matLine = new LineMaterial({
      color: 0xffffff,
      linewidth: 8,
      vertexColors: true,
      dashed: false,
      alphaToCoverage: true,
    });

    const line = new Line2(geometry, matLine);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    this.scene.add(line);
  }

  private async createOiabaText(): Promise<void> {
    try {
      const loader = new FontLoader();

      // Load font from assets
      const response = await fetch('assets/fonts/helvetiker_regular.typeface.json');
      const fontData = await response.json();
      const font = loader.parse(fontData);

      const textGeometry = new TextGeometry('OIABA', {
        font: font,
        size: 5.5,
        depth: 1.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
      });

      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x66FF66 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);

      // Position text to the right of the G, aligned vertically
      textMesh.position.set(7, -2.7, 0);
      this.scene.add(textMesh);
    } catch (error) {
      console.error('Error loading font:', error);
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();

    // Rotate the guava sphere gently
    if ((this as any).guavaSphere) {
      (this as any).guavaSphere.rotation.y += 0.005;
    }

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setViewport(0, 0, 250, 250);
    this.renderer.render(this.scene, this.camera);
  }
}
