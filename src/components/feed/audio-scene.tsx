'use client';

import { Component, memo, type CSSProperties, type ReactNode } from 'react';
import { SCENE_PALETTES, type SceneRecipe } from '@/lib/audio-scene/scene-generator';
import styles from './audio-scene.module.css';

class SceneBoundary extends Component<{ color: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className={styles.scene} style={{ background: this.props.color }} /> : this.props.children; }
}

export const AudioScene = memo(function AudioScene({ recipe, animate }: { recipe: SceneRecipe; animate: boolean }) {
  const palette = SCENE_PALETTES[recipe.family];
  return <div aria-hidden="true" className={styles.scene} data-testid="pods-audio-scene" data-motion={animate ? 'ambient' : 'static'}>
    <SceneBoundary key={`${recipe.seed}:${recipe.family}`} color={palette[0]}>
      <div className={styles.scene} style={{ background: `linear-gradient(135deg,${palette[0]},${palette[1]},${palette[2]})` }} />
      {recipe.shapes.map((shape, i) => <div key={i} className={`${styles.shape} ${animate ? styles.moving : ''}`}
        style={{
          left: `${shape.x * 100}%`, top: `${shape.y * 100}%`, width: `${shape.size * 100}%`,
          aspectRatio: shape.kind === 'band' ? '3.125' : '1', opacity: shape.opacity,
          border: shape.kind === 'ring' ? `2px solid ${palette[3]}` : undefined,
          background: shape.kind === 'ring' ? 'transparent' : palette[3],
          '--rotation': `${shape.rotation}deg`, '--period': `${shape.periodMs}ms`,
          '--dr': recipe.motion === 'restrained' ? '2deg' : '6deg',
          '--dx': recipe.motion === 'restrained' ? '4px' : '10px',
          '--dy': recipe.motion === 'restrained' ? '-6px' : '-18px',
        } as CSSProperties} />)}
    </SceneBoundary>
    <div className={styles.scrim} />
  </div>;
});
