import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import styles from './VoiceMode.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
// THREE.js and GSAP are loaded dynamically from CDN, so we use 'any' for their types
type ThreeJS = any;
type GSAP = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    THREE: ThreeJS;
    gsap: GSAP;
    webkitAudioContext: typeof AudioContext;
  }
}

export interface VoiceModeProps {
  tokenUrl: string;
  agentName?: string;
  onClose: () => void;
  accentColor?: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({
  tokenUrl,
  agentName = 'voice-agent',
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const localDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const remoteDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothedAmplitudeRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const sceneInitializedRef = useRef(false);
  const morphTargetRef = useRef(0);
  const currentMorphRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);

  const getAmplitude = useCallback(() => {
    let localAmplitude = 0;
    let remoteAmplitude = 0;

    if (localAnalyserRef.current && localDataArrayRef.current) {
      localAnalyserRef.current.getByteFrequencyData(localDataArrayRef.current);
      const sum = localDataArrayRef.current.reduce((a, b) => a + b, 0);
      localAmplitude = sum / localDataArrayRef.current.length / 255;
    }

    if (remoteAnalyserRef.current && remoteDataArrayRef.current) {
      remoteAnalyserRef.current.getByteFrequencyData(remoteDataArrayRef.current);
      const sum = remoteDataArrayRef.current.reduce((a, b) => a + b, 0);
      remoteAmplitude = sum / remoteDataArrayRef.current.length / 255;
    }

    const targetAmplitude = Math.max(localAmplitude, remoteAmplitude);
    smoothedAmplitudeRef.current += (targetAmplitude - smoothedAmplitudeRef.current) * 0.25;
    return smoothedAmplitudeRef.current;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupLocalAudioAnalyser = async (track: any) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      const mediaStream = new MediaStream([track.mediaStreamTrack]);
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      localAnalyserRef.current = audioContextRef.current.createAnalyser();
      localAnalyserRef.current.fftSize = 256;
      source.connect(localAnalyserRef.current);
      localDataArrayRef.current = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
    } catch (err) {
      console.error('Failed to set up local audio analyser:', err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupRemoteAudioAnalyser = async (track: any) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const audioEl = track.attach() as HTMLAudioElement;
    audioEl.style.display = 'none';
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', 'true');
    document.body.appendChild(audioEl);

    try {
      await audioEl.play();
    } catch {
      console.log('Audio play failed, will retry on interaction');
    }

    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const source = audioContextRef.current.createMediaStreamSource(mediaStream);
    remoteAnalyserRef.current = audioContextRef.current.createAnalyser();
    remoteAnalyserRef.current.fftSize = 256;
    source.connect(remoteAnalyserRef.current);
    remoteDataArrayRef.current = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (sceneInitializedRef.current) return;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (src.includes('three') && window.THREE) {
          resolve();
          return;
        }
        if (src.includes('gsap') && window.gsap) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initScene = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');

        if (!containerRef.current || !window.THREE) return;

        sceneInitializedRef.current = true;
        const THREE = window.THREE;
        const container = containerRef.current;

        const scene = new THREE.Scene();
        const width = container.clientWidth;
        const height = container.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        rendererRef.current = renderer;
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        camera.position.z = 300;

        // Particle system - Torus (donut) shape
        const particleCount = 12000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const torusPositions = new Float32Array(particleCount * 3);
        const spherePositions = new Float32Array(particleCount * 3);

        const torusRadius = 50;
        const tubeRadius = 22;
        const sphereRadius = 60;

        for (let i = 0; i < particleCount; i++) {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const r = tubeRadius * Math.sqrt(Math.random());

          torusPositions[i * 3] = (torusRadius + r * Math.cos(v)) * Math.cos(u);
          torusPositions[i * 3 + 1] = (torusRadius + r * Math.cos(v)) * Math.sin(u);
          torusPositions[i * 3 + 2] = r * Math.sin(v);

          const sRadius = sphereRadius * Math.cbrt(Math.random());
          const sTheta = Math.random() * Math.PI * 2;
          const sPhi = Math.acos(Math.random() * 2 - 1);

          spherePositions[i * 3] = sRadius * Math.sin(sPhi) * Math.cos(sTheta);
          spherePositions[i * 3 + 1] = sRadius * Math.sin(sPhi) * Math.sin(sTheta);
          spherePositions[i * 3 + 2] = sRadius * Math.cos(sPhi);

          positions[i * 3] = torusPositions[i * 3];
          positions[i * 3 + 1] = torusPositions[i * 3 + 1];
          positions[i * 3 + 2] = torusPositions[i * 3 + 2];

          const brightness = 0.8 + Math.random() * 0.2;
          colors[i * 3] = brightness;
          colors[i * 3 + 1] = brightness;
          colors[i * 3 + 2] = brightness;

          sizes[i] = 1.4 + Math.random() * 1.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('torusPos', new THREE.BufferAttribute(torusPositions, 3));
        geometry.setAttribute('spherePos', new THREE.BufferAttribute(spherePositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            mouse: { value: new THREE.Vector3(9999, 9999, 0) },
            hoverRadius: { value: 35.0 },
            hoverStrength: { value: 30.0 },
            audioAmplitude: { value: 0.0 },
            audioExpansion: { value: 100.0 },
            isConnected: { value: 0.0 },
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            attribute vec3 torusPos;
            attribute vec3 spherePos;
            varying vec3 vColor;
            uniform float time;
            uniform vec3 mouse;
            uniform float hoverRadius;
            uniform float hoverStrength;
            uniform float audioAmplitude;
            uniform float audioExpansion;
            uniform float isConnected;
            
            float hash(vec3 p) {
              p = fract(p * 0.3183099 + 0.1);
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            
            float noise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                    mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                    mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
            }
            
            void main() {
              vec3 disconnectedColor = vec3(0.7, 0.85, 0.87);
              vec3 connectedColor = color;
              vColor = mix(disconnectedColor, connectedColor, isConnected);
              
              vec3 basePos = mix(torusPos, spherePos, isConnected);
              vec3 pos = basePos;
              
              float distFromCenter = length(basePos);
              vec3 dirFromCenter = normalize(basePos);
              float audioNoise = noise(basePos * 0.02 + time * 2.0);
              float expansion = audioAmplitude * audioExpansion * (0.5 + audioNoise);
              pos += dirFromCenter * expansion;
              
              float turbulence = audioAmplitude * 40.0;
              pos.x += sin(time * 3.0 + position.y * 0.05) * turbulence * audioNoise;
              pos.y += cos(time * 3.0 + position.x * 0.05) * turbulence * audioNoise;
              pos.z += sin(time * 2.0 + position.z * 0.05) * turbulence * audioNoise;
              
              vec3 toMouse = pos - mouse;
              float dist = length(toMouse);
              
              float noiseVal = noise(basePos * 0.05 + time * 0.5);
              float featheredRadius = hoverRadius * (0.6 + noiseVal * 0.8);
              
              if (dist < featheredRadius && dist > 0.0) {
                vec3 pushDir = normalize(toMouse);
                float falloff = 1.0 - smoothstep(0.0, featheredRadius, dist);
                falloff = pow(falloff, 0.5);
                
                float angleNoise = noise(basePos * 0.1 + time) * 2.0 - 1.0;
                pushDir.x += angleNoise * 0.3;
                pushDir.y += noise(basePos * 0.1 - time) * 0.3 - 0.15;
                pushDir = normalize(pushDir);
                
                float pushAmount = falloff * hoverStrength * (0.7 + noiseVal * 0.6);
                pos += pushDir * pushAmount;
              }
              
              float flowSpeed = 0.3;
              float swirl = time * flowSpeed;
              
              float angle = atan(basePos.z, basePos.x);
              float flowOffset = sin(swirl + angle * 2.0) * 4.0;
              
              float torusFlow = 1.0 - isConnected;
              
              pos.x += sin(time * 0.5 + basePos.y * 0.02 + angle) * 3.0 * torusFlow;
              pos.z += cos(time * 0.5 + basePos.y * 0.02 + angle) * 3.0 * torusFlow;
              pos.y += flowOffset * torusFlow;
              
              pos.x += sin(time * 0.8 + basePos.y * 0.05) * 2.0;
              pos.y += cos(time * 0.6 + basePos.x * 0.03) * 2.0;
              pos.z += sin(time * 0.7 + basePos.z * 0.04) * 2.0;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              float sizeBoost = 1.0 + audioAmplitude * 0.5;
              gl_PointSize = size * sizeBoost * (200.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
              gl_FragColor = vec4(vColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        materialRef.current = material;

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Mouse tracking
        const mouse = new THREE.Vector2();
        const mouseWorld = new THREE.Vector3();
        const inverseMatrix = new THREE.Matrix4();

        const handleMouseMove = (event: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          mouseWorld.set(mouse.x, mouse.y, 0.5);
          mouseWorld.unproject(camera);

          const dir = mouseWorld.sub(camera.position).normalize();
          const distance = -camera.position.z / dir.z;
          const pos = camera.position.clone().add(dir.multiplyScalar(distance));

          inverseMatrix.copy(particles.matrixWorld).invert();
          pos.applyMatrix4(inverseMatrix);

          material.uniforms.mouse.value.copy(pos);
        };

        const handleMouseLeave = () => {
          material.uniforms.mouse.value.set(9999, 9999, 0);
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        const handleResize = () => {
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };
        
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        let time = 0;
        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);

          time += 0.01;
          material.uniforms.time.value = time;

          const amplitude = getAmplitude();
          material.uniforms.audioAmplitude.value = amplitude;

          currentMorphRef.current += (morphTargetRef.current - currentMorphRef.current) * 0.05;
          material.uniforms.isConnected.value = currentMorphRef.current;

          particles.updateMatrixWorld();
          renderer.render(scene, camera);
        };

        animate();

        return () => {
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseleave', handleMouseLeave);
          resizeObserver.disconnect();
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          renderer.dispose();
        };
      } catch (error) {
        console.error('Failed to initialize scene:', error);
      }
    };

    initScene();
  }, [getAmplitude]);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setStatus('');

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {};
      if (agentName && agentName.trim()) {
        body.room_config = {
          agents: [{ agentName: agentName.trim() }],
        };
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        setStatus('');
        setIsConnected(true);
        setIsConnecting(false);
        morphTargetRef.current = 1.0;
      });

      room.on(RoomEvent.Disconnected, () => {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((el) => {
          el.pause();
          el.srcObject = null;
          el.remove();
        });

        setStatus('');
        setIsConnected(false);
        setIsConnecting(false);
        localAnalyserRef.current = null;
        remoteAnalyserRef.current = null;
        localDataArrayRef.current = null;
        remoteDataArrayRef.current = null;
        smoothedAmplitudeRef.current = 0;
        morphTargetRef.current = 0.0;
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        setStatus('');
      });

      room.on(RoomEvent.TrackSubscribed, (track, _publication, _participant) => {
        if (track.kind === Track.Kind.Audio) {
          setupRemoteAudioAnalyser(track);
          setStatus('');
        }
      });

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track && publication.track.kind === Track.Kind.Audio) {
          setupLocalAudioAnalyser(publication.track);
        }
      });

      await room.connect(data.server_url, data.participant_token);
      await room.localParticipant.setMicrophoneEnabled(true);

      const localTracks = room.localParticipant.audioTrackPublications;
      localTracks.forEach((pub) => {
        if (pub.track) {
          setupLocalAudioAnalyser(pub.track);
        }
      });
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('Connection failed');
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      } catch {
        // Ignore errors
      }
      roomRef.current.disconnect(true);
      roomRef.current = null;
    }

    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((el) => {
      el.pause();
      el.srcObject = null;
      el.remove();
    });

    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    localDataArrayRef.current = null;
    remoteDataArrayRef.current = null;
    smoothedAmplitudeRef.current = 0;

    setIsConnected(false);
    setIsMicMuted(false);
    setStatus('');
    morphTargetRef.current = 0.0;
    onClose();
  };

  const handleOrbClick = () => {
    if (isConnected) {
      disconnect();
    } else if (!isConnecting) {
      connect();
    }
  };

  const toggleMic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (roomRef.current) {
      const newMutedState = !isMicMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMicMuted(newMutedState);

      if (!newMutedState) {
        setTimeout(() => {
          if (roomRef.current) {
            const localTracks = roomRef.current.localParticipant.audioTrackPublications;
            localTracks.forEach((pub) => {
              if (pub.track) {
                setupLocalAudioAnalyser(pub.track);
              }
            });
          }
        }, 100);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect(true);
        roomRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((el) => {
        el.pause();
        el.srcObject = null;
        el.remove();
      });
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Status */}
      {status && <div className={styles.status}>{status}</div>}

      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className={styles.orbContainer}
        onClick={handleOrbClick}
      />

      {/* Instruction text */}
      <div className={styles.instruction}>
        {isConnecting
          ? 'Connecting...'
          : isConnected
          ? 'Tap orb to end call'
          : 'Tap orb to start'}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {isConnected && (
          <button
            onClick={toggleMic}
            className={`${styles.controlButton} ${isMicMuted ? styles.muted : ''}`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            type="button"
          >
            {isMicMuted ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        )}
        <button
          onClick={disconnect}
          className={styles.backButton}
          type="button"
        >
          Back to chat
        </button>
      </div>
    </div>
  );
};
