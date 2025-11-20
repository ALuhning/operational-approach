import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as EffectsIcon,
  Campaign as CampaignIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const DOMAIN_COLORS = {
  land: '#6B8E23',     // Olive Drab
  sea: '#4682B4',     // Steel Blue
  air: '#708090',     // Slate Gray
  cyber: '#556B2F',   // Dark Olive Green
  space: '#2F4F4F',   // Dark Slate Gray
};

const GanttCanvas = ({ oais, filters, viewMode, problemStatement, currentOE, desiredFutureState, objectiveDesiredConditions, effects, coreCommunicationNarrative, onUpdateOAI, onEditOAI, onReorderItems }) => {
  const canvasRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickableItems, setClickableItems] = useState([]);
  const [dragging, setDragging] = useState(null); // { type: 'oai-start'|'oai-end'|'point', item: object, startX: number }
  const [dragOffset, setDragOffset] = useState({ oaiId: null, deltaX: 0, type: null }); // Real-time drag tracking
  const [hasDragged, setHasDragged] = useState(false); // Track if user actually dragged vs just clicked
  const [verticalDrag, setVerticalDrag] = useState(null); // { type: 'oai'|'imo'|'loe', item: object, startY: number, originalIndex: number }
  const [verticalDragOffset, setVerticalDragOffset] = useState({ itemId: null, deltaY: 0, type: null }); // Real-time vertical drag tracking

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        
        // Calculate required height based on data structure
        const hierarchy = {};
        oais.forEach(oai => {
          if (!hierarchy[oai.objective]) hierarchy[oai.objective] = {};
          if (!hierarchy[oai.objective][oai.loe]) hierarchy[oai.objective][oai.loe] = {};
          if (!hierarchy[oai.objective][oai.loe][oai.imo]) hierarchy[oai.objective][oai.loe][oai.imo] = [];
          hierarchy[oai.objective][oai.loe][oai.imo].push(oai);
        });
        
        const rowHeight = 28;
        const headerHeight = 25;
        const loeHeaderHeight = 30;
        const objHeaderHeight = 35;
        let totalHeight = 80; // top padding
        
        Object.keys(hierarchy).forEach(obj => {
          totalHeight += objHeaderHeight + 2; // Objective header + spacing
          Object.keys(hierarchy[obj]).forEach(loe => {
            totalHeight += loeHeaderHeight + 2; // LoE header + spacing
            Object.keys(hierarchy[obj][loe]).forEach(imo => {
              const oaisCount = hierarchy[obj][loe][imo].length;
              totalHeight += headerHeight + (oaisCount * rowHeight) + 3; // IMO header + OAI rows + spacing
            });
            totalHeight += 3; // gap after LoE group
          });
          totalHeight += 5; // gap after objective
        });
        
        totalHeight += 0; // bottom padding
        
        setCanvasSize({
          width: container.clientWidth,
          height: Math.max(totalHeight, window.innerHeight - 200)
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [oais]);

  useEffect(() => {
    if (!canvasRef.current || !oais.length || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    canvas.width = width;
    canvas.height = height;

    // Store clickable items for hit detection
    const items = [];

    // Find earliest OAI start date (only use OAI start dates, not decision/decisive points)
    const now = new Date();
    let earliestOAIStart = null;
    oais.forEach(oai => {
      if (oai.startDate) {
        const startTime = new Date(oai.startDate).getTime();
        if (!earliestOAIStart || startTime < earliestOAIStart) {
          earliestOAIStart = startTime;
        }
      }
    });
    
    // Timeline: Start from beginning of the year containing the earliest OAI
    const earliestDate = earliestOAIStart ? new Date(earliestOAIStart) : now;
    
    // Start timeline at the beginning of the year containing the earliest OAI
    const timelineStartYear = earliestDate.getFullYear();
    const timelineStart = new Date(timelineStartYear, 0, 1).getTime();
    // Extend timeline to at least 2030
    const timelineEnd = new Date(2030, 11, 31).getTime();
    const timelineSpan = timelineEnd - timelineStart;
    
    const padding = { left: 0, right: 0, top: 40, bottom: 0 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Background
    ctx.clearRect(0, 0, width, height);
    
    // Helper function to truncate text to fit width
    const truncateText = (ctx, text, maxWidth) => {
      if (ctx.measureText(text).width <= maxWidth) return text;
      let truncated = text;
      while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + '...';
    };
    
    // Draw vertical year lines
    const timelineStartDate = new Date(timelineStart);
    const startYear = timelineStartDate.getFullYear();
    const endYear = 2030;
    
    for (let year = startYear; year <= endYear; year++) {
      const yearDate = new Date(year, 0, 1);
      const ratio = (yearDate.getTime() - timelineStart) / timelineSpan;
      const x = padding.left + (chartWidth * ratio);
      
      // Only draw if within chart bounds
      if (x < padding.left || x > padding.left + chartWidth) continue;
      
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      
      // Year label (skip first year to avoid clutter)
      if (year > startYear) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(yearDate.getFullYear(), x, padding.top - 20);
      }
      
      // Month markers (quarterly)
      const nextYearDate = new Date(year + 1, 0, 1);
      const nextRatio = (nextYearDate.getTime() - timelineStart) / timelineSpan;
      const nextX = padding.left + (chartWidth * nextRatio);
      const yearWidth = nextX - x;
      
      for (let q = 1; q < 4; q++) {
        const qx = x + (yearWidth * q / 4);
        if (qx >= padding.left && qx <= padding.left + chartWidth) {
          ctx.strokeStyle = '#eee';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(qx, padding.top);
          ctx.lineTo(qx, padding.top + chartHeight);
          ctx.stroke();
        }
      }
    }

    // Organize data hierarchically: Objective -> LOE -> IMO -> OAIs
    const hierarchy = {};
    oais.forEach((oai, idx) => {
      // Debug: log first few OAIs to check dates
      if (idx < 3) {
        console.log('OAI:', oai.subOaiId || 'NO_ID', {
          startDate: oai.startDate,
          endDate: oai.endDate,
          dpDate: oai.dpDate,
          decisionDate: oai.decisionDate,
          decisivePoint: oai.decisivePoint,
          decisionPoint: oai.decisionPoint
        });
      }
      
      if (!hierarchy[oai.objective]) {
        hierarchy[oai.objective] = {};
      }
      if (!hierarchy[oai.objective][oai.loe]) {
        hierarchy[oai.objective][oai.loe] = {};
      }
      if (!hierarchy[oai.objective][oai.loe][oai.imo]) {
        hierarchy[oai.objective][oai.loe][oai.imo] = [];
      }
      hierarchy[oai.objective][oai.loe][oai.imo].push(oai);
    });

    // Function to convert date to X coordinate
    const dateToX = (dateString) => {
      if (!dateString) return padding.left;
      const date = new Date(dateString);
      const ratio = (date.getTime() - timelineStart) / timelineSpan;
      return padding.left + (chartWidth * Math.max(0, Math.min(1, ratio)));
    };
    
    // Function to sort IDs numerically (e.g., "1.1.2" before "1.1.10")
    const sortByNumericId = (items, getId) => {
      return items.sort((a, b) => {
        const aId = getId(a);
        const bId = getId(b);
        if (!aId || !bId) return 0;
        
        const aParts = aId.split('.').map(Number);
        const bParts = bId.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aNum = aParts[i] || 0;
          const bNum = bParts[i] || 0;
          if (aNum !== bNum) return aNum - bNum;
        }
        return 0;
      });
    };

    let currentY = padding.top + 10;

    Object.keys(hierarchy).forEach((objective, objIdx) => {
      const objStartY = currentY;
      const firstOAI = Object.values(hierarchy[objective])[0] && 
                       Object.values(Object.values(hierarchy[objective])[0])[0] &&
                       Object.values(Object.values(hierarchy[objective])[0])[0][0];
      const objectiveId = firstOAI?.objectiveId || '';
      
      // Draw Objective header
      const objHeaderHeight = 35;
      ctx.fillStyle = '#3C5A3C';  // Army green
      ctx.fillRect(padding.left, currentY, chartWidth, objHeaderHeight);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      const objLabel = objectiveId ? `${objectiveId} - ${objective}` : objective;
      const truncatedObjLabel = objLabel.length > 85 ? objLabel.substring(0, 85) + '...' : objLabel;
      ctx.fillText(truncatedObjLabel, padding.left + 20, currentY + objHeaderHeight - 12);
      
      currentY += objHeaderHeight + 2; // Add spacing after Objective header
      
      // Sort LOEs by their numeric ID
      const loeEntries = Object.entries(hierarchy[objective]);
      const sortedLoes = sortByNumericId(loeEntries, ([loe, imos]) => {
        const firstOai = Object.values(imos)[0]?.[0];
        return firstOai?.loeId;
      });
      const loeKeys = sortedLoes.map(([loe]) => loe);
      
      sortedLoes.forEach(([loe, imos], loeIdx) => {
        const firstLoeOAI = Object.values(imos)[0]?.[0];
        const loeId = firstLoeOAI?.loeId || '';
        
        // Calculate LOE block height (header + all IMOs)
        const loeHeaderHeight = 30;
        let loeBlockHeight = loeHeaderHeight + 2;
        const imoEntriesForHeight = Object.entries(imos);
        const sortedImosForHeight = sortByNumericId(imoEntriesForHeight, ([imo, oais]) => oais[0]?.imoId);
        sortedImosForHeight.forEach(([imo, oaisInIMO]) => {
          const rowHeight = 28;
          const headerHeight = 25;
          const imoHeight = headerHeight + (oaisInIMO.length * rowHeight);
          loeBlockHeight += imoHeight + 3;
        });
        loeBlockHeight += 3; // LOE spacing
        
        // Calculate LOE Y offset for drag preview (without modifying currentY)
        let loeYOffset = 0;
        if (verticalDragOffset.type === 'loe' && verticalDragOffset.itemId) {
          const draggedLoeItem = clickableItems.find(item => 
            item.type === 'loe-drag-handle' && 
            item.loe === verticalDragOffset.itemId
          );
          
          if (draggedLoeItem) {
            const draggedIndex = draggedLoeItem.loeIndex;
            const deltaY = verticalDragOffset.deltaY;
            const positionsMoved = Math.round(deltaY / loeBlockHeight);
            const targetIndex = Math.max(0, Math.min(loeKeys.length - 1, draggedIndex + positionsMoved));
            
            if (loe === verticalDragOffset.itemId) {
              loeYOffset = deltaY;
            } else if (draggedIndex < targetIndex && loeIdx > draggedIndex && loeIdx <= targetIndex) {
              loeYOffset = -loeBlockHeight;
            } else if (draggedIndex > targetIndex && loeIdx >= targetIndex && loeIdx < draggedIndex) {
              loeYOffset = loeBlockHeight;
            }
          }
        }
        
        // Draw LoE label header (indented within Objective)
        const loeIndent = 15;
        const loeStartY = currentY + loeYOffset;
        ctx.fillStyle = '#8B7355';  // Khaki/Tan
        ctx.fillRect(padding.left + loeIndent, currentY, chartWidth - loeIndent, loeHeaderHeight);
        
        // Add LOE drag handle clickable area
        const firstLoeOaiForIds = Object.values(hierarchy[objective][loe])[0]?.[0];
        items.push({
          type: 'loe-drag-handle',
          loe: loe,
          objective: objective,
          loeId: firstLoeOaiForIds?.loeId || '',
          objectiveId: firstLoeOaiForIds?.objectiveId || '',
          loeIndex: loeIdx,
          x: padding.left + loeIndent,
          y: loeStartY,
          width: 20,
          height: loeHeaderHeight
        });
        
        // Draw drag handle icon for LOE
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(padding.left + loeIndent + 2, loeStartY + 10, 16, 3);
        ctx.fillRect(padding.left + loeIndent + 2, loeStartY + 16, 16, 3);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        const loeLabel = loeId ? `${loeId} - ${loe}` : loe;
        const truncatedLoeLabel = loeLabel.length > 85 ? loeLabel.substring(0, 85) + '...' : loeLabel;
        ctx.fillText(truncatedLoeLabel, padding.left + loeIndent + 25, currentY + loeHeaderHeight - 10);
        
        currentY += loeHeaderHeight + 2; // Add spacing after LoE header
        
        // Sort IMOs by their numeric ID
        const imoEntries = Object.entries(imos);
        const sortedImos = sortByNumericId(imoEntries, ([imo, oais]) => oais[0]?.imoId);
        const imoKeys = sortedImos.map(([imo]) => imo);
        
        sortedImos.forEach(([imo, oaisInIMO], imoIdx) => {
          const imoId = oaisInIMO[0]?.imoId || '';
          
          // Calculate IMO bucket height (header + one row per OAI)
          const rowHeight = 28;
          const headerHeight = 25;
          const imoHeight = headerHeight + (oaisInIMO.length * rowHeight);
          
          // Calculate IMO Y offset for drag preview (without modifying currentY)
          let imoYOffset = loeYOffset; // Inherit LOE offset
          if (verticalDragOffset.type === 'imo' && verticalDragOffset.itemId) {
            const draggedImoItem = clickableItems.find(item => 
              item.type === 'imo-drag-handle' && 
              item.imo === verticalDragOffset.itemId &&
              item.loe === loe &&
              item.objective === objective
            );
            
            if (draggedImoItem) {
              const draggedIndex = draggedImoItem.imoIndex;
              const deltaY = verticalDragOffset.deltaY;
              const avgImoHeight = imoHeight + 3; // including spacing
              const positionsMoved = Math.round(deltaY / avgImoHeight);
              const targetIndex = Math.max(0, Math.min(imoKeys.length - 1, draggedIndex + positionsMoved));
              
              if (imo === verticalDragOffset.itemId) {
                imoYOffset += deltaY;
              } else if (draggedIndex < targetIndex && imoIdx > draggedIndex && imoIdx <= targetIndex) {
                imoYOffset -= avgImoHeight;
              } else if (draggedIndex > targetIndex && imoIdx >= targetIndex && imoIdx < draggedIndex) {
                imoYOffset += avgImoHeight;
              }
            }
          }
          
          const imoStartY = currentY + imoYOffset;
          
          // Draw IMO bucket background (indented within LoE)
          const imoIndent = 30;
          ctx.fillStyle = imoIdx % 2 === 0 ? '#F5F5DC' : '#FAFAF0';  // Beige and off-white
          ctx.fillRect(padding.left + imoIndent, imoStartY + headerHeight, chartWidth - imoIndent, imoHeight - headerHeight);
          
          // Draw IMO header bar
          ctx.fillStyle = '#9A9A7C';  // Light olive
          ctx.fillRect(padding.left + imoIndent, imoStartY, chartWidth - imoIndent, headerHeight);
          
          // Add IMO drag handle clickable area
          items.push({
            type: 'imo-drag-handle',
            imo: imo,
            loe: loe,
            objective: objective,
            imoId: imoId,
            loeId: loeId,
            objectiveId: objectiveId,
            imoIndex: imoIdx,
            loeIndex: loeIdx,
            x: padding.left + imoIndent,
            y: imoStartY,
            width: 20,
            height: headerHeight
          });
          
          // Draw drag handle icon for IMO
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(padding.left + imoIndent + 2, imoStartY + 7, 16, 2);
          ctx.fillRect(padding.left + imoIndent + 2, imoStartY + 12, 16, 2);
          ctx.fillRect(padding.left + imoIndent + 2, imoStartY + 17, 16, 2);
          
          // Draw IMO header text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          const imoLabel = imoId ? `${imoId} - ${imo}` : imo;
          const truncatedImoLabel = imoLabel.length > 75 ? imoLabel.substring(0, 75) + '...' : imoLabel;
          ctx.fillText(truncatedImoLabel, padding.left + imoIndent + 25, imoStartY + headerHeight - 8);
          
          // Draw IMO border
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(padding.left + imoIndent, imoStartY, chartWidth - imoIndent, imoHeight);
          
          // Draw one OAI bar per OAI (not per domain)
          oaisInIMO.forEach((oai, oaiIdx) => {
            let y = imoStartY + headerHeight + (oaiIdx * rowHeight);
            
            // Apply vertical drag offset for real-time visual feedback
            if (verticalDragOffset.itemId && verticalDragOffset.type === 'oai') {
              const draggedOai = oaisInIMO.find(o => o.id === verticalDragOffset.itemId);
              if (draggedOai) {
                const draggedIndex = oaisInIMO.indexOf(draggedOai);
                const deltaY = verticalDragOffset.deltaY;
                const positionsMoved = Math.round(deltaY / rowHeight);
                const targetIndex = Math.max(0, Math.min(oaisInIMO.length - 1, draggedIndex + positionsMoved));
                
                if (oai.id === verticalDragOffset.itemId) {
                  // The dragged item follows the cursor
                  y += deltaY;
                } else if (draggedIndex < targetIndex && oaiIdx > draggedIndex && oaiIdx <= targetIndex) {
                  // Items between original and target position shift up
                  y -= rowHeight;
                } else if (draggedIndex > targetIndex && oaiIdx >= targetIndex && oaiIdx < draggedIndex) {
                  // Items between target and original position shift down
                  y += rowHeight;
                }
              }
            }
            
            // Add OAI row drag handle clickable area
            items.push({
              type: 'oai-drag-handle',
              oai: oai,
              imo: imo,
              loe: loe,
              objective: objective,
              imoId: oai.imoId || imoId,
              loeId: oai.loeId || loeId,
              objectiveId: oai.objectiveId || objectiveId,
              oaiIndex: oaiIdx,
              imoIndex: imoIdx,
              loeIndex: loeIdx,
              x: padding.left + imoIndent + 2,
              y: y,
              width: 20,
              height: rowHeight
            });
            
            // Draw drag handle icon for OAI (three dots)
            ctx.fillStyle = 'rgba(100,100,100,0.4)';
            const dotY = y + rowHeight / 2;
            ctx.beginPath();
            ctx.arc(padding.left + imoIndent + 8, dotY - 4, 1.5, 0, Math.PI * 2);
            ctx.arc(padding.left + imoIndent + 8, dotY, 1.5, 0, Math.PI * 2);
            ctx.arc(padding.left + imoIndent + 8, dotY + 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Use actual dates if available
            let x1 = oai.startDate ? dateToX(oai.startDate) : dateToX(null);
            let x2 = oai.endDate ? dateToX(oai.endDate) : (x1 + 50);
            
            // Apply drag offset for real-time visual feedback
            if (dragOffset.oaiId === oai.id) {
              if (dragOffset.type === 'handle-start') {
                x1 += dragOffset.deltaX;
              } else if (dragOffset.type === 'handle-end') {
                x2 += dragOffset.deltaX;
              }
            }
            
            // Ensure bars stay within IMO container boundaries
            const imoLeft = padding.left + imoIndent;
            const imoRight = padding.left + chartWidth;
            x1 = Math.max(x1, imoLeft);
            x2 = Math.min(x2, imoRight);
            
            // Skip if dates are out of range or invalid
            if (x2 <= x1 || x1 >= imoRight) return;
            
            const barHeight = rowHeight * 0.6;
            const barY = y + (rowHeight - barHeight) / 2;
            
            // Store clickable area with drag handles
            items.push({
              type: 'bar',
              oai: oai,
              x: x1,
              y: barY,
              width: x2 - x1,
              height: barHeight
            });
            
            // Add drag handles for start and end
            const handleSize = 8;
            items.push({
              type: 'handle-start',
              oai: oai,
              x: x1 - handleSize / 2,
              y: barY,
              width: handleSize,
              height: barHeight
            });
            items.push({
              type: 'handle-end',
              oai: oai,
              x: x2 - handleSize / 2,
              y: barY,
              width: handleSize,
              height: barHeight
            });
            
            // Draw bar (use a neutral color or first active domain color)
            const domains = ['land', 'sea', 'air', 'cyber', 'space'];
            const activeDomain = domains.find(d => oai[d]);
            const isDragging = verticalDragOffset.itemId === oai.id && verticalDragOffset.type === 'oai';
            
            ctx.fillStyle = activeDomain ? DOMAIN_COLORS[activeDomain] : '#6c757d';
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            
            // Add visual feedback for dragged item
            if (isDragging) {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.shadowBlur = 10;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
              ctx.globalAlpha = 0.8;
            }
            
            const radius = 3;
            ctx.beginPath();
            ctx.moveTo(x1 + radius, barY);
            ctx.lineTo(x2 - radius, barY);
            ctx.quadraticCurveTo(x2, barY, x2, barY + radius);
            ctx.lineTo(x2, barY + barHeight - radius);
            ctx.quadraticCurveTo(x2, barY + barHeight, x2 - radius, barY + barHeight);
            ctx.lineTo(x1 + radius, barY + barHeight);
            ctx.quadraticCurveTo(x1, barY + barHeight, x1, barY + barHeight - radius);
            ctx.lineTo(x1, barY + radius);
            ctx.quadraticCurveTo(x1, barY, x1 + radius, barY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Reset shadow and alpha for dragged item
            if (isDragging) {
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              ctx.globalAlpha = 1.0;
            }
            
            // Draw drag handles on start and end
            // Start handle
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.fillRect(x1 - 2, barY + barHeight / 2 - handleSize / 2, 4, handleSize);
            ctx.strokeRect(x1 - 2, barY + barHeight / 2 - handleSize / 2, 4, handleSize);
            // End handle
            ctx.fillRect(x2 - 2, barY + barHeight / 2 - handleSize / 2, 4, handleSize);
            ctx.strokeRect(x2 - 2, barY + barHeight / 2 - handleSize / 2, 4, handleSize);
            
            // OAI ID and Description on bar
            if (x2 - x1 > 30) {
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'left';
              
              // Draw ID
              const oaiId = oai.subOaiId || 'OAI';
              ctx.fillText(oaiId, x1 + 4, barY + barHeight / 2 + 3);
              
              // Draw description next to ID if there's room
              const idWidth = ctx.measureText(oaiId).width;
              const availableWidth = (x2 - x1) - idWidth - 12; // 12px for padding
              
              if (availableWidth > 40) {
                ctx.font = '9px sans-serif';
                const oaiDesc = oai.oaiDescription || '';
                const titleText = truncateText(ctx, oaiDesc, availableWidth);
                ctx.fillText(' - ' + titleText, x1 + 4 + idWidth, barY + barHeight / 2 + 3);
              }
            }
          });
          
          // Draw Decision/Decisive point markers ONCE per OAI
          // Position them at the center Y of each OAI row
          oaisInIMO.forEach((oai, oaiIdx) => {
            // Calculate Y with same offset logic as the OAI bars
            let y = imoStartY + headerHeight + (oaiIdx * rowHeight);
            
            // Apply vertical drag offset for real-time visual feedback (same as above)
            if (verticalDragOffset.itemId && verticalDragOffset.type === 'oai') {
              const draggedOai = oaisInIMO.find(o => o.id === verticalDragOffset.itemId);
              if (draggedOai) {
                const draggedIndex = oaisInIMO.indexOf(draggedOai);
                const deltaY = verticalDragOffset.deltaY;
                const positionsMoved = Math.round(deltaY / rowHeight);
                const targetIndex = Math.max(0, Math.min(oaisInIMO.length - 1, draggedIndex + positionsMoved));
                
                if (oai.id === verticalDragOffset.itemId) {
                  y += deltaY;
                } else if (draggedIndex < targetIndex && oaiIdx > draggedIndex && oaiIdx <= targetIndex) {
                  y -= rowHeight;
                } else if (draggedIndex > targetIndex && oaiIdx >= targetIndex && oaiIdx < draggedIndex) {
                  y += rowHeight;
                }
              }
            }
            
            const oaiMidY = y + rowHeight / 2;
            
            // Helper function to check if a date is within OAI timeline
            const isWithinOAI = (dateStr) => {
              if (!dateStr || !oai.startDate || !oai.endDate) return true;
              const pointDate = new Date(dateStr).getTime();
              const start = new Date(oai.startDate).getTime();
              const end = new Date(oai.endDate).getTime();
              return pointDate >= start && pointDate <= end;
            };
            
            // Legacy single decisive/decision points (for backward compatibility)
            if (oai.decisivePoint && oai.dpDate) {
              const dpX = dateToX(oai.dpDate);
              const markerSize = 12;
              
              // Store clickable area
              items.push({
                type: 'decisivePoint',
                oai: oai,
                label: 'Decisive Point',
                date: oai.dpDate,
                x: dpX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold triangle pointing up
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              ctx.moveTo(dpX, oaiMidY - markerSize);
              ctx.lineTo(dpX + markerSize, oaiMidY + markerSize);
              ctx.lineTo(dpX - markerSize, oaiMidY + markerSize);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              ctx.fillStyle = '#000';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('DP', dpX, oaiMidY - markerSize - 5);
            }
            
            if (oai.decisionPoint && oai.decisionDate) {
              const dcX = dateToX(oai.decisionDate);
              const markerSize = 10;
              
              // Store clickable area
              items.push({
                type: 'decisionPoint',
                oai: oai,
                label: 'Decision Point',
                date: oai.decisionDate,
                x: dcX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold 5-point star
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = markerSize;
                const innerRadius = markerSize * 0.4;
                const outerX = dcX + outerRadius * Math.cos(angle);
                const outerY = oaiMidY + outerRadius * Math.sin(angle);
                const innerAngle = angle + (2 * Math.PI) / 10;
                const innerX = dcX + innerRadius * Math.cos(innerAngle);
                const innerY = oaiMidY + innerRadius * Math.sin(innerAngle);
                if (i === 0) {
                  ctx.moveTo(outerX, outerY);
                } else {
                  ctx.lineTo(outerX, outerY);
                }
                ctx.lineTo(innerX, innerY);
              }
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              ctx.fillStyle = '#000';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('DC', dcX, oaiMidY - markerSize - 5);
            }
            
            // New: Multiple labeled decision points
            if (oai.decisionPoint1Date && isWithinOAI(oai.decisionPoint1Date)) {
              let dcX = dateToX(oai.decisionPoint1Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisionPoint1') {
                dcX += dragOffset.deltaX;
              }
              
              const markerSize = 10;
              
              // Store clickable area
              items.push({
                type: 'decisionPoint',
                oai: oai,
                label: oai.decisionPoint1Label || 'Decision Point 1',
                date: oai.decisionPoint1Date,
                number: 1,
                x: dcX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold 5-point star
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = markerSize;
                const innerRadius = markerSize * 0.4;
                const outerX = dcX + outerRadius * Math.cos(angle);
                const outerY = oaiMidY + outerRadius * Math.sin(angle);
                const innerAngle = angle + (2 * Math.PI) / 10;
                const innerX = dcX + innerRadius * Math.cos(innerAngle);
                const innerY = oaiMidY + innerRadius * Math.sin(innerAngle);
                if (i === 0) {
                  ctx.moveTo(outerX, outerY);
                } else {
                  ctx.lineTo(outerX, outerY);
                }
                ctx.lineTo(innerX, innerY);
              }
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 1 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('1', dcX, oaiMidY);
            }
            
            if (oai.decisionPoint2Date && isWithinOAI(oai.decisionPoint2Date)) {
              let dcX = dateToX(oai.decisionPoint2Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisionPoint2') {
                dcX += dragOffset.deltaX;
              }
              
              const markerSize = 10;
              
              // Store clickable area
              items.push({
                type: 'decisionPoint',
                oai: oai,
                label: oai.decisionPoint2Label || 'Decision Point 2',
                date: oai.decisionPoint2Date,
                number: 2,
                x: dcX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold 5-point star
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = markerSize;
                const innerRadius = markerSize * 0.4;
                const outerX = dcX + outerRadius * Math.cos(angle);
                const outerY = oaiMidY + outerRadius * Math.sin(angle);
                const innerAngle = angle + (2 * Math.PI) / 10;
                const innerX = dcX + innerRadius * Math.cos(innerAngle);
                const innerY = oaiMidY + innerRadius * Math.sin(innerAngle);
                if (i === 0) {
                  ctx.moveTo(outerX, outerY);
                } else {
                  ctx.lineTo(outerX, outerY);
                }
                ctx.lineTo(innerX, innerY);
              }
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 2 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('2', dcX, oaiMidY);
            }
            
            // New: Multiple labeled decisive points
            if (oai.decisivePoint1Date && isWithinOAI(oai.decisivePoint1Date)) {
              let dpX = dateToX(oai.decisivePoint1Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisivePoint1') {
                dpX += dragOffset.deltaX;
              }
              
              const markerSize = 12;
              
              // Store clickable area
              items.push({
                type: 'decisivePoint',
                oai: oai,
                label: oai.decisivePoint1Label || 'Decisive Point 1',
                date: oai.decisivePoint1Date,
                number: 1,
                x: dpX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold triangle pointing up
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              ctx.moveTo(dpX, oaiMidY - markerSize);
              ctx.lineTo(dpX + markerSize, oaiMidY + markerSize);
              ctx.lineTo(dpX - markerSize, oaiMidY + markerSize);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 1 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('1', dpX, oaiMidY + markerSize/4);
            }
            
            if (oai.decisivePoint2Date && isWithinOAI(oai.decisivePoint2Date)) {
              let dpX = dateToX(oai.decisivePoint2Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisivePoint2') {
                dpX += dragOffset.deltaX;
              }
              
              const markerSize = 12;
              
              // Store clickable area
              items.push({
                type: 'decisivePoint',
                oai: oai,
                label: oai.decisivePoint2Label || 'Decisive Point 2',
                date: oai.decisivePoint2Date,
                number: 2,
                x: dpX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold triangle pointing up
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              ctx.moveTo(dpX, oaiMidY - markerSize);
              ctx.lineTo(dpX + markerSize, oaiMidY + markerSize);
              ctx.lineTo(dpX - markerSize, oaiMidY + markerSize);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 2 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('2', dpX, oaiMidY + markerSize/4);
            }
            
            if (oai.decisionPoint3Date && isWithinOAI(oai.decisionPoint3Date)) {
              let dcX = dateToX(oai.decisionPoint3Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisionPoint3') {
                dcX += dragOffset.deltaX;
              }
              
              const markerSize = 10;
              
              // Store clickable area
              items.push({
                type: 'decisionPoint',
                oai: oai,
                label: oai.decisionPoint3Label || 'Decision Point 3',
                date: oai.decisionPoint3Date,
                number: 3,
                x: dcX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold 5-point star
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const outerRadius = markerSize;
                const innerRadius = markerSize * 0.4;
                const outerX = dcX + outerRadius * Math.cos(angle);
                const outerY = oaiMidY + outerRadius * Math.sin(angle);
                const innerAngle = angle + (2 * Math.PI) / 10;
                const innerX = dcX + innerRadius * Math.cos(innerAngle);
                const innerY = oaiMidY + innerRadius * Math.sin(innerAngle);
                if (i === 0) {
                  ctx.moveTo(outerX, outerY);
                } else {
                  ctx.lineTo(outerX, outerY);
                }
                ctx.lineTo(innerX, innerY);
              }
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 3 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('3', dcX, oaiMidY);
            }
            
            if (oai.decisivePoint3Date && isWithinOAI(oai.decisivePoint3Date)) {
              let dpX = dateToX(oai.decisivePoint3Date);
              
              // Apply drag offset for real-time visual feedback
              if (dragOffset.oaiId === oai.id && dragOffset.type === 'point-decisivePoint3') {
                dpX += dragOffset.deltaX;
              }
              
              const markerSize = 12;
              
              // Store clickable area
              items.push({
                type: 'decisivePoint',
                oai: oai,
                label: oai.decisivePoint3Label || 'Decisive Point 3',
                date: oai.decisivePoint3Date,
                number: 3,
                x: dpX - markerSize,
                y: oaiMidY - markerSize,
                width: markerSize * 2,
                height: markerSize * 2
              });
              
              // Draw gold triangle pointing up
              ctx.fillStyle = '#B8860B';
              ctx.beginPath();
              ctx.moveTo(dpX, oaiMidY - markerSize);
              ctx.lineTo(dpX + markerSize, oaiMidY + markerSize);
              ctx.lineTo(dpX - markerSize, oaiMidY + markerSize);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw number 3 in center
              ctx.fillStyle = '#000';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('3', dpX, oaiMidY + markerSize/4);
            }
          });
          
          currentY += imoHeight + 3; // Add spacing between IMO buckets
        });
        
        currentY += 3; // Add spacing after LoE group
      });
      
      // Draw Objective border/container
      const objHeight = currentY - objStartY;
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 3;
      ctx.strokeRect(padding.left, objStartY, chartWidth, objHeight);
      
      currentY += 5; // Add spacing after Objective group
    });

    // Store items for hit detection
    setClickableItems(items);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oais, filters, viewMode, canvasSize, problemStatement, dragOffset, verticalDragOffset]);

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
      {/* Top Row: Current OE | Problem Statement | Desired Future State */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
        {/* Current OE Column */}
        {currentOE && (
          <Box sx={{ 
            width: '30%',
            flexShrink: 0,
            bgcolor: '#F5F5DC', 
            borderRadius: 1,
            border: '2px solid #8B7355',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: '#3C5A3C', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon sx={{ color: '#fff', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                Current Operational Environment
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
                <ReactMarkdown>{currentOE}</ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Problem Statement - Centered */}
        {problemStatement && (
          <Box sx={{ 
            flex: 1,
            bgcolor: '#F5F5DC', 
            borderRadius: 1,
            border: '2px solid #8B7355',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: '#8B7355', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: '#fff', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                Problem Statement
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
                <ReactMarkdown>{problemStatement}</ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Desired Future State Column */}
        {desiredFutureState && (
          <Box sx={{ 
            width: '30%',
            flexShrink: 0,
            bgcolor: '#F5F5DC', 
            borderRadius: 1,
            border: '2px solid #8B7355',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: '#3C5A3C', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: '#fff', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                Desired Future State
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
                <ReactMarkdown>{desiredFutureState}</ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Second Row: Objective Desired Conditions | Visualization + Narrative | Effects */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
        {/* Objective Desired Conditions Column */}
        {objectiveDesiredConditions && (
          <Box sx={{ 
            width: '250px',
            flexShrink: 0,
            bgcolor: '#F5F5DC', 
            borderRadius: 1,
            border: '2px solid #8B7355',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: '#3C5A3C', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: '#fff', fontSize: '0.9rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                Objective Desired Conditions
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
                <ReactMarkdown>{objectiveDesiredConditions}</ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Center section: Visualization + Communication Narrative */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2, minWidth: 0 }}>
          {/* Main Visualization */}
          <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              cursor: hoveredItem?.type?.startsWith('handle') ? 'ew-resize' : 
                      (hoveredItem?.type === 'decisivePoint' || hoveredItem?.type === 'decisionPoint') ? 'grab' :
                      (hoveredItem?.type?.endsWith('-drag-handle')) ? 'ns-resize' :
                      hoveredItem ? 'pointer' : 'default',
          border: 'none'
        }}
        onMouseDown={(e) => {
          if (!hoveredItem) return;
          
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          setHasDragged(false); // Reset drag tracking
          
          if (hoveredItem.type === 'oai-drag-handle') {
            setVerticalDrag({
              type: 'oai',
              item: hoveredItem,
              startY: y,
              originalIndex: hoveredItem.oaiIndex
            });
            e.preventDefault();
          } else if (hoveredItem.type === 'imo-drag-handle') {
            setVerticalDrag({
              type: 'imo',
              item: hoveredItem,
              startY: y,
              originalIndex: hoveredItem.imoIndex
            });
            e.preventDefault();
          } else if (hoveredItem.type === 'loe-drag-handle') {
            setVerticalDrag({
              type: 'loe',
              item: hoveredItem,
              startY: y,
              originalIndex: hoveredItem.loeIndex
            });
            e.preventDefault();
          } else if (hoveredItem.type === 'handle-start' || hoveredItem.type === 'handle-end') {
            setDragging({
              type: hoveredItem.type,
              oai: hoveredItem.oai,
              startX: x
            });
            e.preventDefault();
          } else if (hoveredItem.type === 'decisivePoint' || hoveredItem.type === 'decisionPoint') {
            setDragging({
              type: 'point',
              item: hoveredItem,
              startX: x
            });
            e.preventDefault();
          }
        }}
        onMouseMove={(e) => {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          setMousePos({ x: e.clientX, y: e.clientY });
          
          if (verticalDrag) {
            // Track vertical dragging
            const deltaY = y - verticalDrag.startY;
            if (Math.abs(deltaY) > 2) {
              setHasDragged(true);
              // Update vertical drag offset for real-time visual feedback
              let itemId;
              if (verticalDrag.type === 'oai') {
                itemId = verticalDrag.item.oai?.id;
              } else if (verticalDrag.type === 'imo') {
                itemId = verticalDrag.item.imo;
              } else if (verticalDrag.type === 'loe') {
                itemId = verticalDrag.item.loe;
              }
              
              setVerticalDragOffset({
                itemId: itemId,
                deltaY: deltaY,
                type: verticalDrag.type
              });
            }
            e.preventDefault();
            return;
          }
          
          if (dragging) {
            // Update drag offset for real-time visual feedback
            const deltaX = x - dragging.startX;
            
            // Track that user has dragged (moved more than 2 pixels)
            if (Math.abs(deltaX) > 2) {
              setHasDragged(true);
            }
            
            let offsetType = dragging.type;
            
            // For points, include the specific point type
            if (dragging.type === 'point' && dragging.item) {
              const pointType = dragging.item.type; // 'decisivePoint' or 'decisionPoint'
              const pointNum = dragging.item.number || '';
              offsetType = `point-${pointType}${pointNum}`;
            }
            
            setDragOffset({ 
              oaiId: dragging.oai?.id || dragging.item?.oai?.id, 
              deltaX, 
              type: offsetType 
            });
            e.preventDefault();
            return;
          }
          
          // Find hovered item
          let found = null;
          for (let i = clickableItems.length - 1; i >= 0; i--) {
            const item = clickableItems[i];
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
              found = item;
              break;
            }
          }
          
          setHoveredItem(found);
        }}
        onMouseUp={(e) => {
          if (verticalDrag && onReorderItems) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const deltaY = y - verticalDrag.startY;
            
            // Calculate new index based on deltaY
            const rowHeight = verticalDrag.type === 'oai' ? 28 : verticalDrag.type === 'imo' ? 25 : 30;
            const positionsMoved = Math.round(deltaY / rowHeight);
            
            if (Math.abs(positionsMoved) > 0 && Math.abs(deltaY) > rowHeight / 2) {
              onReorderItems(verticalDrag.type, verticalDrag.item, positionsMoved);
            }
            
            setVerticalDrag(null);
            setVerticalDragOffset({ itemId: null, deltaY: 0, type: null });
            setHasDragged(false);
            return;
          }
          
          if (!dragging || !onUpdateOAI) {
            setDragging(null);
            setDragOffset({ oaiId: null, deltaX: 0, type: null });
            return;
          }
          
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const deltaX = x - dragging.startX;
          
          // Create helper functions to convert between dates and X coordinates
          const timelineStart = new Date(new Date(oais[0]?.startDate || Date.now()).getFullYear(), 0, 1).getTime();
          const timelineEnd = new Date(2030, 11, 31).getTime();
          const timelineSpan = timelineEnd - timelineStart;
          const padding = { left: 0, right: 0, top: 40, bottom: 0 };
          const chartWidth = canvas.width - padding.left - padding.right;
          
          // Convert pixel delta to time delta and get new date
          const MS_PER_DAY = 24 * 60 * 60 * 1000;
          const timeDelta = (deltaX / chartWidth) * timelineSpan;
          const daysDelta = Math.round(timeDelta / MS_PER_DAY);
          
          if (dragging.type === 'handle-start') {
            const currentStart = new Date(dragging.oai.startDate);
            const newStart = new Date(currentStart.getTime() + (daysDelta * MS_PER_DAY));
            onUpdateOAI(dragging.oai.id, { startDate: newStart.toISOString().split('T')[0] });
          } else if (dragging.type === 'handle-end') {
            const currentEnd = new Date(dragging.oai.endDate);
            const newEnd = new Date(currentEnd.getTime() + (daysDelta * MS_PER_DAY));
            onUpdateOAI(dragging.oai.id, { endDate: newEnd.toISOString().split('T')[0] });
          } else if (dragging.type === 'point') {
            const currentDate = new Date(dragging.item.date);
            const newDate = new Date(currentDate.getTime() + (daysDelta * MS_PER_DAY));
            
            // Determine the correct date field based on point type and number
            const pointType = dragging.item.type; // 'decisivePoint' or 'decisionPoint'
            const pointNum = dragging.item.number || '';
            const dateField = `${pointType}${pointNum}Date`;
            
            onUpdateOAI(dragging.item.oai.id, { [dateField]: newDate.toISOString().split('T')[0] });
          }
          
          setDragging(null);
          setDragOffset({ oaiId: null, deltaX: 0, type: null });
        }}
        onMouseLeave={() => {
          setHoveredItem(null);
          setDragging(null);
          setDragOffset({ oaiId: null, deltaX: 0, type: null });
          setVerticalDrag(null);
          setVerticalDragOffset({ itemId: null, deltaY: 0, type: null });
        }}
        onClick={(e) => {
          // Only show info popup if user didn't drag
          if (hoveredItem && !hasDragged) {
            if (hoveredItem.type === 'bar') {
              setSelectedItem(hoveredItem.oai);
            } else if (hoveredItem.type === 'decisivePoint' || hoveredItem.type === 'decisionPoint') {
              setSelectedItem(hoveredItem.oai);
            }
          }
          setHasDragged(false); // Reset for next interaction
        }}
      />
      
      {dragging && (
        <Box
          sx={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            bgcolor: 'rgba(33, 150, 243, 0.95)',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            boxShadow: 4,
            zIndex: 2000,
            pointerEvents: 'none',
            border: '2px solid #fff'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {dragging.type === 'handle-start' && 'Adjusting Start Date'}
            {dragging.type === 'handle-end' && 'Adjusting End Date'}
            {dragging.type === 'point' && `Moving ${dragging.item.label}`}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '13px' }}>
            {(() => {
              const canvas = canvasRef.current;
              if (!canvas) return '';
              
              const timelineStart = new Date(new Date(oais[0]?.startDate || Date.now()).getFullYear(), 0, 1).getTime();
              const timelineEnd = new Date(2030, 11, 31).getTime();
              const timelineSpan = timelineEnd - timelineStart;
              const chartWidth = canvas.width;
              const timeDelta = (dragOffset.deltaX / chartWidth) * timelineSpan;
              
              let currentDate, newDate;
              if (dragging.type === 'handle-start') {
                currentDate = new Date(dragging.oai.startDate);
                newDate = new Date(currentDate.getTime() + timeDelta);
              } else if (dragging.type === 'handle-end') {
                currentDate = new Date(dragging.oai.endDate);
                newDate = new Date(currentDate.getTime() + timeDelta);
              } else if (dragging.type === 'point') {
                currentDate = new Date(dragging.item.date);
                newDate = new Date(currentDate.getTime() + timeDelta);
              }
              
              return newDate ? newDate.toISOString().split('T')[0] : '';
            })()}
          </Typography>
        </Box>
      )}
      
      {hoveredItem && !selectedItem && !dragging && (
        <Box
          sx={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            boxShadow: 3,
            maxWidth: 350,
            zIndex: 2000,
            pointerEvents: 'none'
          }}
        >
          {hoveredItem.type === 'bar' || hoveredItem.type?.startsWith('handle') ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {hoveredItem.oai?.subOaiId || 'OAI'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                {(hoveredItem.oai?.oaiDescription || '').length > 80 
                  ? (hoveredItem.oai?.oaiDescription || '').substring(0, 80) + '...'
                  : (hoveredItem.oai?.oaiDescription || '')}
              </Typography>
              {hoveredItem.type?.startsWith('handle') && (
                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5, color: '#4fc3f7' }}>
                  Drag to adjust {hoveredItem.type === 'handle-start' ? 'start' : 'end'} date
                </Typography>
              )}
              {hoveredItem.type === 'bar' && (
                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5, color: '#B8860B' }}>
                  Click for full details
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {hoveredItem.label}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                Date: {hoveredItem.date}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#4fc3f7', mb: 0.5 }}>
                OAI: {hoveredItem.oai?.subOaiId || 'OAI'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                {(hoveredItem.oai?.oaiDescription || '').length > 60 
                  ? (hoveredItem.oai?.oaiDescription || '').substring(0, 60) + '...'
                  : (hoveredItem.oai?.oaiDescription || '')}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5, color: '#B8860B' }}>
                Click for full details
              </Typography>
            </>
          )}
        </Box>
      )}
      
      {selectedItem && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'white',
            p: 3,
            borderRadius: 2,
            boxShadow: 4,
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 1000
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedItem?.subOaiId || 'OAI'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {selectedItem?.oaiDescription || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onEditOAI && (
                <IconButton 
                  size="small" 
                  onClick={() => onEditOAI(selectedItem)}
                  title="Edit OAI"
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setSelectedItem(null)}>
                <Typography variant="body2">✕</Typography>
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {selectedItem.objective}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>LOE:</strong> {selectedItem.loe}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>IMO:</strong> {selectedItem.imo}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Duration:</strong> {selectedItem.durationMonths} months
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Start:</strong> {selectedItem.startDate}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>End:</strong> {selectedItem.endDate}
          </Typography>
          
          {(selectedItem.land || selectedItem.sea || selectedItem.air || selectedItem.cyber || selectedItem.space) && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Domain Activities:
              </Typography>
              {selectedItem.land && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Land:</strong> {selectedItem.land}
                </Typography>
              )}
              {selectedItem.sea && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Sea:</strong> {selectedItem.sea}
                </Typography>
              )}
              {selectedItem.air && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Air:</strong> {selectedItem.air}
                </Typography>
              )}
              {selectedItem.cyber && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Cyber:</strong> {selectedItem.cyber}
                </Typography>
              )}
              {selectedItem.space && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Space:</strong> {selectedItem.space}
                </Typography>
              )}
            </>
          )}
          
          {(selectedItem.decisionPoint1Label || selectedItem.decisionPoint2Label || selectedItem.decisionPoint3Label ||
            selectedItem.decisivePoint1Label || selectedItem.decisivePoint2Label || selectedItem.decisivePoint3Label) && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                Key Points:
              </Typography>
              {selectedItem.decisivePoint1Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decisive Point 1:</strong> {selectedItem.decisivePoint1Label} ({selectedItem.decisivePoint1Date})
                </Typography>
              )}
              {selectedItem.decisivePoint2Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decisive Point 2:</strong> {selectedItem.decisivePoint2Label} ({selectedItem.decisivePoint2Date})
                </Typography>
              )}
              {selectedItem.decisivePoint3Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decisive Point 3:</strong> {selectedItem.decisivePoint3Label} ({selectedItem.decisivePoint3Date})
                </Typography>
              )}
              {selectedItem.decisionPoint1Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decision Point 1:</strong> {selectedItem.decisionPoint1Label} ({selectedItem.decisionPoint1Date})
                </Typography>
              )}
              {selectedItem.decisionPoint2Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decision Point 2:</strong> {selectedItem.decisionPoint2Label} ({selectedItem.decisionPoint2Date})
                </Typography>
              )}
              {selectedItem.decisionPoint3Label && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Decision Point 3:</strong> {selectedItem.decisionPoint3Label} ({selectedItem.decisionPoint3Date})
                </Typography>
              )}
            </>
          )}
          
          {selectedItem.dependsOn && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                Dependencies:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Depends on: {selectedItem.dependsOn}
              </Typography>
            </>
          )}
          
          {selectedItem.branchNotes && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                Branch Notes:
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {selectedItem.branchNotes}
              </Typography>
            </>
          )}
        </Box>
      )}
      </Box>
      
      {/* Core Communication Narrative */}
      {coreCommunicationNarrative && (
        <Box sx={{ bgcolor: '#F5F5DC', borderRadius: 1, border: '2px solid #8B7355', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#8B7355', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CampaignIcon sx={{ color: '#fff', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
              Core Communication Narrative
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
              <ReactMarkdown>{coreCommunicationNarrative}</ReactMarkdown>
            </Box>
          </Box>
        </Box>
      )}
        </Box>
        
        {/* Effects Column */}
        {effects && (
          <Box sx={{ 
            width: '250px',
            flexShrink: 0,
            bgcolor: '#F5F5DC', 
            borderRadius: 1,
            border: '2px solid #8B7355',
            overflow: 'hidden'
          }}>
            <Box sx={{ bgcolor: '#3C5A3C', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EffectsIcon sx={{ color: '#fff', fontSize: '0.9rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                Effects
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ fontSize: '11px', lineHeight: 1.5, fontFamily: 'Arial, sans-serif', '& p': { margin: 0, marginBottom: 0.5 }, '& ul, & ol': { marginTop: 0.5, marginBottom: 0.5, paddingLeft: 2 }, '& li': { marginBottom: 0.25 } }}>
                <ReactMarkdown>{effects}</ReactMarkdown>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
    </>
  );
};

export default GanttCanvas;
