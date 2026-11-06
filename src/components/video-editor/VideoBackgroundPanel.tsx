import { Row, Slider, Switch } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { LOADING_CUTOUT, setBackgroundRemoval } from './clipJobs';
import type { VideoClip } from '../../model/videoProject';
import '../editor/panels/panels.css';

// A video clip's Background (Effects → Background): the switch beside the heading turns background
// removal on or off (utils/personSegmenter keeps the people), the slider softens their edge.
export function VideoBackgroundPanel({ item }: { item: VideoClip }) {
  const loading = useEditorStore((s: { busy: string | null }) => s.busy === LOADING_CUTOUT);
  const cutout = item.bgRemoval;
  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-background-sheet ie-tool-sheet">
        {cutout && (
          <Row label="Edges">
            <Slider
              label="Edge softness"
              min={0}
              max={1}
              step={0.05}
              value={cutout.softness}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(softness) => useEditorStore.getState().updateItem(item.id, { bgRemoval: { softness } })}
            />
          </Row>
        )}
        <p className="vt-panel-hint" role="status">
          {loading ? 'Loading background removal… the first time takes a moment.'
            : 'Keeps the people and clears the rest. Put a photo, a colour or another clip behind it.'}
        </p>
      </div>
    </div>
  );
}

export const VideoBackgroundAside = ({ item }: { item: VideoClip }) => (
  <Switch label="Remove background" checked={Boolean(item.bgRemoval)} onChange={() => setBackgroundRemoval(item, !item.bgRemoval)} />
);
