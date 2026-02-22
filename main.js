import * as THREE from 'three';

// =============================================================================
// STARFIELD & ASTEROIDS
// A Three.js scene featuring a procedural starfield with 10,000 glowing stars
// and 100 animated asteroids with randomized shapes, speeds, and directions.
// =============================================================================

// -----------------------------------------------------------------------------
// Scene Setup
// -----------------------------------------------------------------------------

const scene = new THREE.Scene();

// Exponential fog gives a natural depth falloff — objects far away fade to black
scene.fog = new THREE.FogExp2(0x000000, 0.005);

const camera = new THREE.PerspectiveCamera(
    75, // Field of view in degrees
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// -----------------------------------------------------------------------------
// Lighting
// -----------------------------------------------------------------------------

// Soft ambient light ensures no surface is completely black
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Directional light simulates a distant sun, giving asteroids depth and shadow
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 10, 5);
scene.add(dirLight);

// -----------------------------------------------------------------------------
// Stars
// -----------------------------------------------------------------------------

/**
 * Generates a radial gradient canvas texture to give stars a soft glow effect.
 * @returns {THREE.CanvasTexture}
 */
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Radial gradient: bright white center fading to fully transparent edge
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
}

/**
 * Creates 10,000 stars distributed randomly in a 100x100x100 unit cube.
 * Uses BufferGeometry and Points for efficient rendering.
 */
function createStars() {
    const count = 10000;
    const vertices = new Float32Array(count * 3); // x, y, z per star

    for (let i = 0; i < count * 3; i++) {
        vertices[i] = (Math.random() - 0.5) * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        map: createStarTexture(),
        depthWrite: false, // Prevents z-fighting with transparent particles
        sizeAttenuation: true, // Stars shrink with distance
    });

    scene.add(new THREE.Points(geometry, material));
}

createStars();

// -----------------------------------------------------------------------------
// Asteroids
// -----------------------------------------------------------------------------

// Load a rock texture to give asteroids a realistic surface appearance
const textureLoader = new THREE.TextureLoader();
const asteroidTexture = textureLoader.load('asteroid-texture.jpg');

const asteroids = [];

/**
 * Creates a single asteroid with randomized size, shape, speed, and direction,
 * then adds it to the scene and the asteroids array for animation tracking.
 */
function createAsteroid() {
    const radius = Math.random() * 0.5 + 0.1; // 0.1 – 0.6 units
    const detail = Math.floor(Math.random() * 2); // 0 = angular, 1 = rounder

    const geometry = new THREE.DodecahedronGeometry(radius, detail);



    // Subtle color variation across three shades of grey
    const colors = [0x555555, 0x777777, 0x999999];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const material = new THREE.MeshStandardMaterial({
        color,
        map: asteroidTexture,
        flatShading: true, // Low-poly flat shading enhances the rocky look
    });

    const asteroid = new THREE.Mesh(geometry, material);

    // Random starting position within a 20x20x20 unit cube around the origin
    asteroid.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
    );

    // Store movement data on the mesh for use in the animation loop
    asteroid.userData = {
        speed: Math.random() * 0.05 + 0.01,
        direction: new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize()
    };

    asteroids.push(asteroid);
    scene.add(asteroid);
}

for (let i = 0; i < 100; i++) {
    createAsteroid();
}

// -----------------------------------------------------------------------------
// Animation Loop
// -----------------------------------------------------------------------------

function animate() {
    requestAnimationFrame(animate);

    asteroids.forEach(asteroid => {
        // Move asteroid along its direction vector scaled by its speed
        asteroid.position.add(
            asteroid.userData.direction.clone().multiplyScalar(asteroid.userData.speed)
        );

        // Rotate for visual interest — gives a natural tumbling effect
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.01;

        // If the asteroid drifts too far from the origin, respawn it nearby
        if (asteroid.position.length() > 50) {
            asteroid.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            // Assign a new random direction and speed on respawn
            asteroid.userData.direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            asteroid.userData.speed = Math.random() * 0.05 + 0.01;
        }
    });

    renderer.render(scene, camera);
}

animate();

// -----------------------------------------------------------------------------
// Responsive Resize
// -----------------------------------------------------------------------------

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});