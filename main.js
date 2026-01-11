import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const WORKER_URL = 'https://liverpool-fixtures.andyesgrove.workers.dev';
const UPDATE_INTERVAL = 30000; // Check every 30 seconds

let currentTextMesh = null;
let anchor = null;
let loadedFont = null;
let lastFixtureData = null;

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: './assets/targets/targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;
    
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    anchor = mindarThree.addAnchor(0);
    
    // Load raccoon
    const loader = new GLTFLoader();
    loader.load(
      './assets/models/AFCWhyteleafeLogoC4D.gltf', 
      (gltf) => {
        const raccoon = gltf.scene;
        raccoon.scale.set(0.05, 0.05, 0.05);
        raccoon.position.set(0, -0.4, 0);
        anchor.group.add(raccoon);
      }
    );
    
    // Pre-load font once
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font) => {
        loadedFont = font;
        console.log('Font loaded successfully');
        updateFixtureText(); // Initial load after font is ready
      }
    );
    
    // Function to create/update text
    const createTextMesh = (fixtureText) => {
      if (!loadedFont) {
        console.log('Font not loaded yet, skipping...');
        return;
      }
      
      // Remove old text if it exists
      if (currentTextMesh) {
        console.log('Removing old text mesh');
        anchor.group.remove(currentTextMesh);
        currentTextMesh.geometry.dispose();
        currentTextMesh.material.dispose();
      }
      
      // Create new text
      const textGeometry = new TextGeometry(fixtureText, {
        font: loadedFont,
        size: 0.06,
        height: 0.02,
      });
      textGeometry.center();
      
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x0066cc });
      currentTextMesh = new THREE.Mesh(textGeometry, textMaterial);
      currentTextMesh.position.set(0, 0.3, 0);
      
      anchor.group.add(currentTextMesh);
      console.log('New text mesh added:', fixtureText);
    };
    
    // Fetch and update fixture text
    const updateFixtureText = async () => {
      try {
        console.log('Checking for fixture updates...', new Date().toLocaleTimeString());
        const response = await fetch(WORKER_URL + '?cb=' + Date.now()); // Cache bust
        const data = await response.json();
        
        console.log('Fixture data received:', data);
        
        if (data.success) {
          const { homeTeam, awayTeam, date } = data.fixture;
          
          // Check if data has changed
          const fixtureString = JSON.stringify(data.fixture);
          if (fixtureString === lastFixtureData) {
            console.log('No changes detected');
            return;
          }
          
          console.log('Fixture data changed! Updating...');
          lastFixtureData = fixtureString;
          
          const matchDate = new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
          });
          
          const fixtureText = `${homeTeam} vs\n${awayTeam}\n${matchDate}`;
          createTextMesh(fixtureText);
        }
      } catch (error) {
        console.error('Error updating fixture:', error);
      }
    };
    
    // Auto-update every 30 seconds
    setInterval(updateFixtureText, UPDATE_INTERVAL);
    
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});