import {
    faBackwardStep,
    faForwardStep,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';
import {
    WorldStatistics_Region,
    WorldStatistics_World,
} from '../../../../proto/spark_pb';
import ChunkCountsList from './ChunkCountsList';
import EntityCountsList from './EntityCountsList';

interface Region extends WorldStatistics_Region {
    world: string;
}

export interface WorldRegionSummaryProps {
    worlds: WorldStatistics_World[];
}

export default function WorldRegionSummary({
    worlds,
}: WorldRegionSummaryProps) {
    const regions = useMemo(() => {
        const regions: Region[] = [];
        for (const world of worlds) {
            for (const worldRegion of world.regions) {
                const region: Region = { ...worldRegion, world: world.name };
                region.chunks.sort((a, b) => b.totalEntities - a.totalEntities);
                regions.push(region);
            }
        }
        regions.sort((a, b) => b.totalEntities - a.totalEntities);
        return regions;
    }, [worlds]);

    const [regionIdx, setRegionIdx] = useState(0);

    const safeIdx = useMemo(() => {
        if (!regions.length) return 0;
        return ((regionIdx % regions.length) + regions.length) % regions.length;
    }, [regionIdx, regions.length]);

    const region = useMemo(() => regions[safeIdx], [regions, safeIdx]);

    const samples = useMemo(() => region?.samples ?? [], [region]);
    const latest = useMemo(
        () => (samples.length ? samples[samples.length - 1] : null),
        [samples]
    );

    const combinedEntities = useMemo(() => {
        const combined: Record<string, number> = {};
        if (!region) return combined;

        for (const chunk of region.chunks) {
            for (const [name, count] of Object.entries(chunk.entityCounts)) {
                combined[name] = (combined[name] ?? 0) + count;
            }
        }
        return combined;
    }, [region]);

    function previous() {
        if (!regions.length) return;
        setRegionIdx(prev => (prev - 1 + regions.length) % regions.length);
    }

    function next() {
        if (!regions.length) return;
        setRegionIdx(prev => (prev + 1) % regions.length);
    }

    if (!regions.length) {
        return (
            <div className="region-view">
                <div className="header region-selector">
                    <span>No regions</span>
                </div>
            </div>
        );
    }

    return (
        <div className="region-view">
            <div className="header region-selector">
                <div className="button" onClick={previous} title="Previous">
                    <FontAwesomeIcon icon={faBackwardStep} />
                </div>
                <span>
                    Region #{safeIdx + 1} (of {regions.length})
                </span>
                <div className="button" onClick={next} title="Next">
                    <FontAwesomeIcon icon={faForwardStep} />
                </div>
            </div>

            <div className="detail-lists">
                <div>
                    <p>
                        <b>Entities </b> (<span>{region.totalEntities}</span>):
                    </p>
                    <EntityCountsList entityCounts={combinedEntities} />
                </div>

                <div>
                    <p>
                        <b>World</b>: {region.world}
                    </p>

                    <p>
                        <b>Folia Region ID</b>: {region.foliaRegionId ?? 'N/A'}
                    </p>


                        <p>
                        <b>TPS</b>: {latest ? latest.tps.toFixed(2) : 'N/A'}
                    </p>

                    <p>
                        <b>MSPT</b>: {latest ? latest.mspt.toFixed(2) : 'N/A'}
                    </p>

                    <p>
                        <b>CPU Util</b>:{' '}
                        {latest
                            ? ((latest.utilisation ?? 0) * 100).toFixed(1)
                            : 'N/A'}
                        %
                    </p>

                    <br />

                    <p>
                        <b>Chunks</b> (<span>{region.chunks.length}</span>):
                    </p>
                    <ChunkCountsList chunks={region.chunks} />
                </div>
            </div>
        </div>
    );
}
