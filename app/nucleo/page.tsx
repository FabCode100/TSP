'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { getGraphData } from '@/actions/db';
import { useRouter } from 'next/navigation';

type Node = d3.SimulationNodeDatum & {
  id: string;
  group: number;
  radius: number;
  frequency: number;
  label: string;
};

type Link = d3.SimulationLinkDatum<Node> & {
  source: string | Node;
  target: string | Node;
  value: number;
};

export default function Nucleo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [graphData, setGraphData] = useState<{nodes: Node[], links: Link[]}>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await getGraphData();
      
      const maxWeight = Math.max(...data.nodes.map((n: any) => n.weight), 1);
      
      const nodes: Node[] = data.nodes.map((n: any) => ({
        id: n.id,
        label: n.label,
        group: n.type === 'conceito' ? 0 : n.type === 'emocao' ? 1 : 2,
        radius: 8 + (n.weight / maxWeight) * 24,
        frequency: n.weight / maxWeight,
      }));

      const links: Link[] = data.edges.map((e: any) => ({
        source: e.sourceId,
        target: e.targetId,
        value: e.strength,
      }));

      setGraphData({ nodes, links });
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || graphData.nodes.length === 0) return;

    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgElement)
      .attr('width', width)
      .attr('height', height)
      .call(d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
        g.attr('transform', event.transform);
      }))
      .append('g');

    const g = svg;

    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force('link', d3.forceLink<Node, Link>(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as Node).radius + 10));

    const link = g.append('g')
      .selectAll('path')
      .data(graphData.links)
      .join('path')
      .attr('stroke', 'var(--pulse)')
      .attr('stroke-opacity', d => 0.2 + d.value * 0.4)
      .attr('stroke-width', 1)
      .attr('fill', 'none');

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 1])
      .range(['var(--whisper)', 'var(--pulse)']);

    const node = g.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.frequency))
      .attr('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        setSelectedNode(d);
        
        // Add pulse ring
        d3.select(event.currentTarget.parentNode as SVGGElement)
          .append('circle')
          .attr('cx', d.x!)
          .attr('cy', d.y!)
          .attr('r', d.radius)
          .attr('fill', 'none')
          .attr('stroke', 'var(--pulse)')
          .attr('stroke-width', 2)
          .attr('class', 'pulse-ring')
          .transition()
          .duration(1000)
          .attr('r', d.radius + 20)
          .attr('stroke-opacity', 0)
          .remove();
      });

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('fill', 'var(--signal)')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 12)
      .attr('pointer-events', 'none');

    // Breathing animation
    d3.timer((elapsed) => {
      node.attr('r', d => d.radius + Math.sin(elapsed / 636 + d.index!) * 2);
    });

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
        
      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
      if (svgElement) {
        d3.select(svgElement).selectAll('*').remove();
      }
    };
  }, [graphData, loading]);

  return (
    <div className="h-full w-full bg-void relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(123, 156, 255, 0.08) 0%, transparent 70%)' }} />
      
      {/* Header with Patterns link */}
      <div className="absolute top-12 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
        <h1 className="font-display text-[28px] text-signal leading-none pointer-events-auto">Núcleo</h1>
        <button 
          onClick={() => router.push('/padroes')}
          className="px-4 py-2 bg-membrane/40 backdrop-blur-md border border-threshold rounded-full text-[11px] font-interface text-whisper uppercase tracking-widest hover:text-pulse hover:border-pulse transition-all pointer-events-auto"
        >
          Ver Padrões
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-full" />

      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="absolute inset-0 bg-void/60 backdrop-blur-sm z-20"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-membrane rounded-t-[24px] p-6 z-30 pb-[calc(24px+env(safe-area-inset-bottom,34px))]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-[24px] text-signal capitalize">Conceito: {selectedNode.label}</h3>
                <button onClick={() => setSelectedNode(null)} className="text-whisper">✕</button>
              </div>
              <p className="font-body text-[18px] text-signal/80 leading-relaxed">
                Este nó representa uma convergência de {Math.floor(selectedNode.frequency * 100)}% de frequência em seus padrões recentes.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
