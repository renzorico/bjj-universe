import { GraphEdgeViewModel, GraphNodeViewModel } from '@/domain/types';

export type GraphDisplayMode = 'all' | 'rivalry' | 'era';

export interface GraphFilters {
  year: number | null;
  division: string | null;
  displayMode: GraphDisplayMode;
}

export interface SceneNodeViewModel extends GraphNodeViewModel {
  activeMatches: number;
}

export interface SceneEdgeViewModel extends GraphEdgeViewModel {
  color: string;
  size: number;
}

export interface GraphSceneModel {
  nodes: SceneNodeViewModel[];
  edges: SceneEdgeViewModel[];
  years: number[];
  divisions: string[];
}

export interface GraphAthleteDetail {
  athlete: SceneNodeViewModel;
  relatedMatches: Array<
    SceneEdgeViewModel & {
      opponentLabel: string;
      resultLabel: 'Won over' | 'Lost to';
    }
  >;
}
