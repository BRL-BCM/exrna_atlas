// globals
var LT_CONF ;
var fileConf; 
function linearTree()
{
  
  d3.json(buildConfPath("fileConf.json"), function(error, json) {
   fileConf = json ;
   d3.json(buildConfPath(fileConf.linearConf), function(error, json) {
    LT_CONF = json ;
    LT_CONF.INIT.radius = Math.min(LT_CONF.canvas.width / 2, LT_CONF.canvas.height) / 2;
    var totalSize = 0;
    var root ;
    var currIdx = 0 ;
    d3.transition().delay(500).call(doLinearTree) ;
    function doLinearTree() {
      // hack in stacked bar
      d3.json(buildConfPath(fileConf.linearTreeSummaryConf), function(error, json) {
      var file = json ;
      var colors = file.colors ; // by depth, not by data
      // Other ways to create custom color set or use built-in sets:
      //var d3colors = d3.scale.ordinal(file.colors) ;
      //var d3colors = d3.scale.category20c() ;
      var x = d3.scale.linear().range([0, 2 * Math.PI]) ;
      var y = d3.scale.linear().range([0, LT_CONF.INIT.radius]) ;

      var div = d3.select("div#restOfPage").append("div") ;
      div.attr("id", file.id)
         .classed("titledSunburst", true)
         .style("width", "" + (LT_CONF.canvas.width) + "px")
         .style("max-width", "" + LT_CONF.canvas.width + "px")
         .style("min-height", "" + (LT_CONF.canvas.height + LT_CONF.canvas.title.height) + "px")
         .style("max-height", "" + (LT_CONF.canvas.height + LT_CONF.canvas.title.height) + "px") ;
      var svgDiv = div.append("div") ;
      svgDiv.attr("id", file.id + "-title")
        .classed("title", true)
        .style("min-height", "" + (LT_CONF.canvas.title.height) + "px")
        .style("max-height", "" + (LT_CONF.canvas.title.height) + "px")
        .text(file.title) ;

      var sbDiv = div.append("div") ;
      sbDiv.attr("id", file.id + "-sb")
         .classed("sb", true)
         .classed("canvas", true)
         .style("position", "relative")
         .style("min-width", "" + LT_CONF.canvas.width + "px")
         .style("min-height", "" + LT_CONF.canvas.height + "px")
         .style("max-width", "" + LT_CONF.canvas.width + "px")
         .style("max-height", "" + LT_CONF.canvas.height + "px") ;

      sbDiv.call(addLinearTree, file) ;

      function addLinearTree(div, file) {
        // REF: http://bl.ocks.org/metmajer/5480307

        var sequenceArray  ; // current path
        var divRect = div.node().getBoundingClientRect() ;
        var viewBoxWidth = (divRect.width * LT_CONF.canvas.vbWidth) ;
        var viewBoxHeight = (divRect.height * LT_CONF.canvas.vbHeight) ;
        var treeWidth = (viewBoxWidth - LT_CONF.canvas.margin.right - LT_CONF.canvas.margin.left) ;
        var treeHeight = (viewBoxHeight - LT_CONF.canvas.margin.top - LT_CONF.canvas.margin.bottom) ;

        var svgElem = div.append("svg")
          .classed(div.attr("id"), true)
          .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight) ;

        addTierTitles() ;

        var svg = svgElem
          //.attr("preserveAspectRatio", "xMinYMin meet")
          .style("width", "" + divRect.width + "px")
          .style("height", "" + divRect.height + "px")
          .style("position", "relative")
          .append("g") // First (and root) 'g' is our svg variable where we can add more graphic elements.
             .attr("id", "drawing") ;
        svg.attr("transform", "translate(" + LT_CONF.canvas.margin.left + "," + LT_CONF.canvas.margin.top + ")") ;

        // D3 tree layout:
        var tree = d3.layout.tree().size([treeHeight, treeWidth]);
        // d3 diagonal function to go from a D3-selected svg element to a target (used to make the node links/paths)
        var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

        function addTierTitles() {
          file.facets.forEach( function(facet,ii) {
            var depth = ((ii+1.65) * LT_CONF.canvas.nodes.depth) ;
            svgElem.append('g')
               .classed("tier", true)
               .attr("transform", "translate(" + depth + ", 20)")
               .append("text")
                 .classed("title", true)
                 .style("fill", d3.rgb(file.colors[ii]).darker())
                 .text(facet) ;
          }) ;
        }

        // Load actual D3 hierarchical data via ajax. Calls event handler when loaded.
        var datajsonPath = getD3dataPath() ;
        datajsonPath += "?collName="+atlasSettings.analysesColl+"&format=cluster&transformationName="+encodeURIComponent(file.transformation)+"&"+csrf_param+"="+csrf_token ;
        d3.json(datajsonPath, function(error, root) {
          // Radius function. Computes radius from mapping the sqrt of the real data RANGE to the visual display DOMAIN
          var calcRadius = d3.scale.sqrt().domain([0, root.size]).range([LT_CONF.canvas.nodes.radiusMin, LT_CONF.canvas.nodes.radiusMax]) ;

          // Where to start off first (root) node? Root node is only one with no .parent field (useful)
          root.x0 = viewBoxWidth / 2 ;
          root.y0 = 0 ;

          // Start drawing process
          root.children.forEach(collapse) ;
          update(null, root) ;
          addFilterMenu() ;

          var rootElem = d3.selectAll("g.node circle.node").filter(function(e,j) { return e.parent ? false : true; }) ;
          var rootElemG = rootElem.node().parentNode ;
          var explainText = d3.select(rootElemG).append("text");
          explainText.classed("explanation", true)
          explainText.attr("transform", "translate(0," + (calcRadius(root.size) + LT_CONF.explanation.topOffset) + ")") ;
          updateExplainText(root, root) ;

          // "Collapse" is dumb, basially just hide the .children in of each node under d in the respective
          // node's ._children and re-draw via update(). Unlike "click" version, this (a) collapses WHOLE tree
          // and (b) doesn't do a toggle.
          function collapse(d) {
            if(d.children) {
              d._children = d.children ;
              d._children.forEach(collapse) ;
              d.children = null ;
            }
          }

          // Can be used to adjust vertical center of circle ("xx") somewhat based on circle radius
          // and on vertical distance circle is from root node vertical position, etc. Doesn't help much due to tree.layout's handling
          // of node collapse/expand.
          function adjustXByRadius(root, d, xx) {
            var retVal = xx ;
            if(d.parent) {
              var adj = (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ;
              adj /= (1.5 + Math.abs(root.x - d.x) / root.x)
              if(d.x <= root.x) {
                retVal -= adj ;
              }
              else {
                retVal += adj ;
              }
            }
            return retVal ;
          }

          // Update the explanation text based on currently selected samples along path
          function updateExplainText(hoverNodeDatum, root) {
            var selected = (hoverNodeDatum.parent ? hoverNodeDatum.size : 0.0) ;
            var sel = commify("" + selected) ;
            var tot = commify("" + root.size) ;
            var perc = commify( "" + (selected / root.size * 100.0).toFixed(2) ) ;
            explainText.text(null) ;
            var dy = 0 ;
            LT_CONF.explanation.spanTextTmpl.forEach( function (tt, jj) {
              var tspan = explainText.append("tspan") ;
              tspan.attr("x", 0)
                   .attr("y", 0)
                   .attr("dy", "" + (jj + 1.1) + "em") ;
              var newText = tt.replace(/\{sel\}/, sel).replace(/\{tot\}/, tot).replace(/\{perc\}/, perc) ;
              tspan.text(newText) ;
            }) ;
            return ;
          }

          function update(elem, source) {
            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes);

            // Normalize for fixed-depth (the horizontal tiers, since y goes left->right here)
            nodes.forEach(function(d) { d.y = d.depth * LT_CONF.canvas.nodes.depth; });

            // Update the node data objects...add some unqiue .id since can't rely on d.name to be unique obviously
            var node = svg.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++currIdx); });

            // Enter any new nodes at the parent's previous position. enter() == "create for first time"
            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                  var yy = source.y0 ;
                  var xx = source.x0 ;
                  // Can try to influence xx (vertical center) of circle via heuristics. Doesn't help much.
                  //xx = adjustXByRadius(root, d, xx) ;
                  //return "translate(" + source.y0 + "," + source.x0 + ")") ;
                  return "translate(" + yy + "," + xx + ")";
                })
                .on("click", click)
                .on("mouseover", hoverNode);

            nodeEnter.append("circle")
                .classed("node", true)
                .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } )
                .style("fill", function (d) {  return ( (d.depth == 0) ? "#e6e6e6" : (file.colors[d.depth-1]) ) ; })
                .style("stroke", function (d) { return ( (d.depth == 0) ? "steelblue" : d3.rgb(file.colors[d.depth-1]).darker() ) ; })
                .style("stroke-width", "" + LT_CONF.canvas.nodes.stroke + "px") ;

            nodeEnter.append("text") // Prelim text object...will get subject to wrap and <tspan>-ized, so no point with many nuances here
                .classed("label", true)
                .attr("x", function(d) {  return d.children || d._children ? -0 : 0 ; })
                .attr("dy", "1.6em")
                .text(function(d) { return d.name ; })
                //.style("fill-opacity", 1e-6);
                .style("visibility", "hidden")
                .style("fill-opacity", 0);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(LT_CONF.animation.duration)
                // At start of transition for this node, disable event handlers during transition
                .each("start", function () { d3.select(this).on("click", null).on("mouseover", null) } )
                // At end of transition for this node, restore event handlers
                .each("end", function (d) {
                  d3.select(this).on("click", click).on("mouseover", hoverNode) ;
                  if(elem != null && this == elem) { hoverNode.bind(this)(d) ; }
                } )
                .attr("transform", function(d) {
                  var yy = d.y ;
                  var xx = d.x ;
                  // Can try to influence xx (vertical center) of circle via heuristics. Doesn't help much.
                  //xx = adjustXByRadius(root, d, xx) ;
                  return "translate(" + yy + "," + xx + ")" ;
                });

            nodeUpdate.select("circle")
                .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } )
                .style("fill", function (d) { return ( (d.depth == 0) ? "#e6e6e6" : (file.colors[d.depth-1]) ) ; })
                .style("stroke", function (d) { return ( (d.depth == 0) ? "steelblue" : d3.rgb(file.colors[d.depth-1]).darker() ) ; })
                .style("stroke-width", "" + LT_CONF.canvas.nodes.stroke + "px") ;

            nodeUpdate.select("text")
                .style("visibility", "visible")
                .style("fill-opacity", 1);

            // Transition exiting nodes (destroy/collapse) to the parent's new position so they "shrink")
            var nodeExit = node.exit().transition()
                .duration(LT_CONF.animation.duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } ) ;

            nodeExit.select("text")
                //.style("fill-opacity", 1e-6);
                .style("visibility", "hidden")
                .style("fill-opacity", 0);


            // Update the data associated with the links. Make sure they know about their target node id
            var link = svg.selectAll("path.link")
                .data(links, function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .style("stroke", function(d) {
                  var targetCircle = d3.selectAll("circle").filter(function(e, j) { return e.id == d.target.id; }) ;
                  var targetFill = targetCircle.style("fill") ;
                  return targetFill ;
                })
                .style("stroke-width", function(d) { // based on target node radius
                  return (isNaN(calcRadius(d.target.size)) ? 2 : (calcRadius(d.target.size) * LT_CONF.canvas.links.strokeRadiusRatio)) ;
                })
                //.attr("opacity", LT_CONF.canvas.links.opacity)
                .style("stroke-opacity", LT_CONF.canvas.links.opacity)
                .attr("d", function(d) {
                  var o = {x: source.x0, y: source.y0};
                  return diagonal({source: o, target: o});
                });

            // Transition links to their new position.
            link.transition()
                .duration(LT_CONF.animation.duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position. So they "shrink" back
            link.exit().transition()
                .duration(LT_CONF.animation.duration)
                .attr("d", function(d) {
                  var o = {x: source.x, y: source.y};
                  return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
              d.x0 = d.x;
              d.y0 = d.y;
            });

            // Add node labels, making sure to attempt word-wrap
            d3.selectAll("#drawing text.label").call(wrapText) ;

            // Update explain text positon in case root node moved
          }

          // Toggle children on click. (same as collapse )
          function click(d, node) {
            if(d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
            update(this, d);
          }

          function nodeOnPath(nodeDatum, sequenceArray) {
            // For node to be on path, all parents must be on path or root.
            var retVal = false ;
            var datumAtDepth = sequenceArray[nodeDatum.depth - 1] ;
            if((typeof(datumAtDepth) != "undefined") && (datumAtDepth != null)) { // node not on path
              if(nodeDatum.name == datumAtDepth.name) { // Node name matches path for this depth. Not enough, since node names not unique for tiers>1
                if(nodeDatum.depth == 1) { // Parent is root, so value is unique (names unique for tier 1)
                  retVal = true ;
                }
                else { // parent must be on path
                  retVal = nodeOnPath(nodeDatum.parent, sequenceArray) ;
                }
              }
            }
            return retVal ;
          }

          function resetPath() {
            sequenceArray = null ;
            // Stop animations circle animations where they are
            d3.selectAll("#drawing g.node circle.node").transition().duration(0) ;
            // Reset circle appearance
            d3.selectAll("#drawing g.node circle.node")
              .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } )
              .style("stroke-width", "" + LT_CONF.canvas.nodes.stroke + "px") ;
            // No animations on links, but would need to stop them too if there were.
            // Reset link appearance.
            d3.selectAll("#drawing path.link")
                .style("stroke-width", function(d) { // based on target node radius
                  return (isNaN(calcRadius(d.target.size)) ? 2 : (calcRadius(d.target.size) * LT_CONF.canvas.links.strokeRadiusRatio)) ;
                })
                //.attr("opacity", LT_CONF.canvas.links.opacity) ;
                .style("stroke-opacity", LT_CONF.canvas.links.opacity) ;
          }

          function hoverNode(d) {
            // Reset all node and link styling first (immediate, no async animation)
            resetPath() ;

            // Update explanation text (count & % selected text)
            updateExplainText(d, root) ;

            // For each tier/depth find the specific node on the path.
            // - Start at root, find the node for depth=1.
            // - For all depths>1, the node's *parent* must also be in the path. Node values can be reused in tiers>1 !
            sequenceArray = getAncestors(d) ;
            var pathD3Circles = [ ] ; // Collect circles on the path. Makes handling async hovers reliable (see below)
            sequenceArray.forEach( function (datumAtDepth, ii) {
              var depth = ii + 1 ;
              d3.selectAll("#drawing g.node circle.node").filter( function (dd, jj) {
                  return ((dd.depth == depth) && (dd.name == datumAtDepth.name)) ;
              }).each( function (ee, kk) {
                var d3circle = d3.select(this) ;
                var d3circleDatum = d3circle.datum() ;
                // d3circle has right depth and value...but it is on the path (node value can be reused in tiers>1)?
                var onPath = nodeOnPath(d3circleDatum, sequenceArray) ;
                if(onPath) {
                  pathD3Circles.push(d3circle) ;
                }
              }) ;
            }) ;
            // Animate the circles on the path.
            // - First, get the list of circles NOT on the path.
            //   . We will use these to interrupt & reset those circles' animations just-in-time
            //   . Hover events are async so it's possible to get here in 2+ threads at same time (even with resetPath() call obviously)
            var nonPathCircles = d3.selectAll("#drawing g.node circle.node").filter( function(dd, jj) {
              var currCircle = this ;
              // Use filter to workaround IE non ECMA script support
              var circleInPath = (pathD3Circles.filter( function (xx) { return xx.node() == currCircle ; } ) ? false : true)
              return circleInPath.length > 0 ? false : true ;
              // If support ECMA 262+ just do this:
              // return (pathD3Circles.find( function (xx) { return xx.node() == currCircle ; } ) ? false : true) ;
            }) ;
            // - Second, animate each circle on the path
            pathD3Circles.forEach( function(d3circle, ii) {
              d3circle.transition()
                .duration(LT_CONF.animation.duration)
                .each("start", function () { // animation "start" event listener.
                  // Just-in-time stop of ALL ongoing NON-path related animations. i.e. parallel async hover events
                  nonPathCircles.transition().duration(0) ;
                  // Just-in-time reset of ALL NON-path related animations. i.e. in case parallel async hover events made some progress
                  nonPathCircles
                    .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } )
                    .style("stroke-width", "" + LT_CONF.canvas.nodes.stroke + "px") ;
                })
                .attr("r", function (d) { return (isNaN(calcRadius(d.size)) ? 2 : calcRadius(d.size)) ; } )
                .style("stroke-width", "" + LT_CONF.canvas.nodes.strokePlus + "px") ;
            });

            // For each tier/depth find the specific links on the path.
            // - Start at root, find the node for depth=1.
            // - For all depths>1, BOTH the source and target nodes in the link must be on the path.
            sequenceArray.forEach( function (datumAtDepth, ii) {
              var depth = ii + 1 ;
              d3.selectAll("#drawing path.link").filter( function (dd, jj) {
                return (nodeOnPath(dd.target, sequenceArray) && (dd.source.depth == 0 || nodeOnPath(dd.source, sequenceArray))) ;
              })
              .each( function (ee, kk) {
                var d3link = d3.select(this) ;
                d3link.style("stroke-width", function(d) { // based on target node radius
                  return (isNaN(calcRadius(d.target.size)) ? 2 : (calcRadius(d.target.size) * LT_CONF.canvas.links.strokeRadiusRatioPlus)) ;
                }) ;
                //d3link.attr("opacity", LT_CONF.canvas.links.opacityPlus) ;
                d3link.style("stroke-opacity", LT_CONF.canvas.links.opacityPlus)
              }) ;
            }) ;
          }

          // USEFUL HELPER:
          // Given a node in a partition layout, return an array of all of its ancestor
          // nodes, highest first, but excluding the root.
          function getAncestors(node) {
            var path = [];
            var current = node;
            while(current.parent) {
              path.unshift(current);
              current = current.parent;
            }
            return path;
          }

          // Takes the current text string in the "text" text element and REPLACES it with
          // a set of tspans (lines) of wrapped text.
          // - Will rejoin separate lines coming out of splitText() if doing so makes a line that is acceptably long.
          function wrapText(text) {
            text.each( function() {
              var text = d3.select(this) ;
              var datum = text.datum() ;
              var isRoot = (datum.parent ? false : true) ;
              var rawText = datum.name ;
              rawText = (file.labelMap[rawText] || rawText) ;
              rawText += ( " (" + datum.size + ")" ) ;
              var x = text.attr("x") ;
              var y = text.attr("y") ;
              var dy = 0 ;
              var dx ;
              var words ;
              if(isRoot) {
                // Here, because root node will be large, we want to put text INSIDE the known-large node:
                dx = 0 ;
                // Also, becuase of putting text INSIDE, we want a bit more aggressive wrapping AND text->node alignment
                words = splitText(rawText, LT_CONF.crumbs.labels.maxChrsRootNode, LT_CONF.crumbs.labels.minChrs).reverse() ;
                text.style("text-anchor", "middle") ;
              }
              else {
                // Don't know size of other nodes, so we'll put their labels to the RIGHT of their node:
                dx = ( (isNaN(calcRadius(datum.size)) ? 2 : calcRadius(datum.size)) + 5 ) ;
                // Will allow much longer labels for regular nodes since placed to the right. Also will use
                // our default (via CSS) text->node alignment of text-anchor:start
                words = splitText(rawText, LT_CONF.crumbs.labels.maxChrs, LT_CONF.crumbs.labels.minChrs).reverse() ;
              }
              // Clear out existing text and use 1+ <tspan> tags to do wrapping within <text> instead:
              text.text(null) ;
              var word ;
              var line = [] ;
              var tspan = text.append("tspan") ;
              tspan.attr("x", x)
                   .attr("y", y)
                   .attr("dx", dx)
                   .attr("dy", "" + (dy + (dy * 0.1)) + "em") ;
              var lineNum = 1 ;
              while( (word = words.pop()) ) {
                // Will the word fit if added to the current line?
                if( (line.length < 1) || ((line.join(" ").length + word.length) <= (isRoot ? LT_CONF.crumbs.labels.maxChrsRootNode : LT_CONF.crumbs.labels.maxChrs)) )
                {
                  line.push(word) ; // yes, so push into line
                }
                else // no, so dump current line and start a new <tspan>
                {
                  text.style("dominant-baseline", "text-after-edge") ;
                  tspan.text(line.join(" ")) ;
                  //if(tspan.node().getComputedTextLength() > LT_CONF.INIT.radius) // INTERESTING! see http://bl.ocks.org/mbostock/7555321
                  line = [ word ] ;
                  tspan = text.append("tspan") ;
                  tspan.attr("x", x)
                       .attr("y", y)
                       .attr("dx", dx)
                       .attr("dy", "" + "1.1em") ;
                  lineNum += 1 ;
                }
              }
              // Dump the last line
              tspan.text(line.join(" ")) ;
            }) ;
          } ;

          // Splitting function. Able to split on words AND hyphenate.
          function splitText(str, tgtMax, tgtMin) {
            var retVal = [] ;
            if(str.length < tgtMax)
            {
              retVal.push(str) ;
            }
            else
            {
              var hyphRE = new RegExp(".{1," + tgtMax + "}", "g") ;
              var words = str.split(/\s/) ;
              words.forEach( function(word) {
                var parts = word.match(hyphRE) ;
                var lastIdx = parts.length - 1 ;
                if(parts.length >= 2)
                {
                  if(parts[lastIdx].length < tgtMin)
                  {
                    parts[lastIdx-1] += parts[lastIdx] ;
                    parts.splice(lastIdx, 1) ;
                    lastIdx = parts.length - 1 ;
                  }
                }
                for(var ii=0; ii<parts.length; ii++)
                {
                  retVal.push( parts[ii] + (ii!=lastIdx ? "-" : "") ) ;
                }
              }) ;
            }
            return retVal ;
          }

          function addFilterMenu() {
            function stickyMenu() {
              // var windowScrolled = d3.select("html").node().scrollTop ; // same as pageYOffset standard javascript
              var menu = d3.select("#filterMenu") ;
              // - Get size of filterMenu:
              var menuRect = menu.node().getBoundingClientRect() ;
              // Must find new "top" (y) position for filterMenu. See if can place relative to top of actual sb graphic.
              //var underlay = d3.select("#drawing") ;
              var underlay = d3.select("#diseaseSB-sb") ;
              var underlayRect = underlay.node().getBoundingClientRect() ;
              var menuTop = underlayRect.top + LT_CONF.menu.offsetTop ;
              var visibility = "none" ;
              // Is there room for menu with this top?
              if(menuTop > 4) {
                visibility = "block" ;
              }
              else { // no room, try lower
                // First, since top of sb is off window, try some little offset from top of window
                menuTop = LT_CONF.menu.offsetBodyTop ;
                // Still acceptable w.r.t. the bottom of the sb?
                if(menuTop <= (underlayRect.bottom - menuRect.height - LT_CONF.menu.minBottomDelta)) {
                  visibility = "block" ;
                }
                else { // no, still no room
                  visibility = "none" ;
                }
              }

              menu.transition()
                  .delay(300)
                  .style("top", "" + menuTop + "px")
                  .style("display", visibility) ;
            }

            d3.json(buildConfPath(fileConf.sbfilterMenu), function(error, data) {
              var filterMenu = data ;
              // Setup menu
              var underlay = d3.select("#diseaseSB-sb") ;
              var underlayRect = underlay.node().getBoundingClientRect()
              var menu = d3.select("body").append("div") ;
              menu.attr("id", "filterMenu")
                  .classed("floatMenu-ng", true)
                  .classed("filterMenu", true)
                  .style("top", "" + (underlayRect.top + LT_CONF.menu.offsetTop) + "px")
                  //.style("left", "" +  (underlayRect.left + LT_CONF.menu.offsetRight) + "px") ;
                  .style("left", "" +  (underlayRect.right - LT_CONF.menu.offsetRight) + "px") ;
              var menuItems = menu.append("ul") ;
              filterMenu.forEach( function (item) {
                var menuItem = item ;
                menuItems.append("li").classed(item.name, true)
                  .append("a")
                    .attr("title", item.title)
                    .html("&nbsp;")
                    .on("click", menuClick) ;
              }) ;
              d3.select(window).on("scroll", stickyMenu) ;
            }) ;

            function menuClick(d, i) {
              var li = d3.select(this).node().parentNode ;
              var liClasses = li.classList ;
              if(liClasses.contains("delete")) {
                resetPath() ;
              }
              else if(liClasses.contains("search")) {
                applyFilters() ;
              }
            }

            function applyFilters() {
              if(sequenceArray != null && sequenceArray.length > 0) {
                var output = { "transformation" : file.transformation, "transformColl" : atlasSettings[file.transformColl], "filters" : [] } ;
                sequenceArray.forEach( function( value, ii) {
                  var depth = ii +1 ;
                  var facet = file.facets[ii] ;
                  output.filters.push( {
                    "facet" : facet,
                    "rank" : depth,
                    "values" : [ value.name ]
                  }) ;
                }) ;

                // If they actually made selections, do post, else do nothing.
                if(output.filters.length > 0) {
                  postAsJson(file.search, output) ;
                }
              }
            }

            function postAsJson(path, data) {
              var form = d3.select("body").append("form") ;
              form.attr("method", "post")
                  .attr("action", path) ; 
              var field = form.append("input") ;
              field.attr("type", "hidden")
             .attr("name", "hierTransform")
                   .attr("value", JSON.stringify(data)) ;
              var fieldcsrf = form.append("input") ;
              fieldcsrf.attr("type", "hidden")
                .attr("name", csrf_param)
                .attr("value", csrf_token) ;
              form.node().submit() ;
            }
          }
        }) ;
      }
    }) ;
    }
  }) ;
 }) ;
}


// builds the configuration data file path (local files)
function buildConfPath(confFile) {
  return urlMount + "/projects/" + projectId + "/exat/data/" + confFile ;
}

function buildPrjSpecFilePath(confFile) {
  return urlMount + "/projects/" + projectId + "/exat/prjdata/" + confFile ;
}

// builds d3 datapath
function getD3dataPath() {
  return urlMount + "/projects/" + projectId + "/exat/d3data" ;
}
