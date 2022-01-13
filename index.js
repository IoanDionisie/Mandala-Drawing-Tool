const palette = [
    "#9BDAF3","#D8CCF4","#FAC2BB","#F8CD94","#9EDDDD","#FBE491","#FFC4E4","#C7E59A","#D0D3D6",
    "#34B3E4","#A589D9","#F16D64","#F59640","#35BEC1","#F3C746","#F371AF","#95C753","#A0A3A6",
    "#008CC9","#7C5BBB","#DD2E1F","#EC640C","#009EA5","#E6A700","#E2247F","#60AA14","#737679",
    "#005E93","#573B93","#A40F1C","#AF4104","#00727D","#AA7D00","#B10C5C","#3B7511","#000000"
  ];
  
  Vue.component('switch-btn', {
    props: ['id', 'label', 'value'],
    template: '#switchBtn',
  });
  
  new Vue({
    el: '#app',
    data: {
      strokeWidth: 1,
      strokeColor: '#008CC9',
      strokePrecision: 100,
      repeat: 7,
      width: 0, height: 0,
      cx: 0, cy: 0,
      layer: {
        mirror: true,
        repeat: 7,
        elements: [],
      },
      current: {
        type: '',
        points: [],
      },
      viewBox: null,
      zoom: 100,
      palette,
      showPalette: false,
      showStroke: false,
      showLayer: false,
      showMarks: true,
    },
  
    watch: {
      strokeColor(value) {
        this.current.stroke = value;
      },
      repeat(value) {
        this.layer.repeat = parseInt(value);
      },
      showPalette(value) {
        if (value) {
          this.showStroke = false;
          this.showLayer = false;
        }
      },
      showStroke(value) {
        if (value) {
          this.showPalette = false;
          this.showLayer = false;
        }
      },
      showLayer(value) {
        if (value) {
          this.showPalette = false;
          this.showStroke = false;
        }
      }
    },
  
    computed: {
      transform() {
        return this.translate(this.cx, this.cy);
      }
    },
  
    created() {
      this.line = d3.line().curve(d3.curveBasis);
    },
  
    mounted() {
      this.onResize();
      window.addEventListener('resize', this.onResize);
      document.addEventListener('keyup', this.onKeyUp);
    },
  
    mixins: [ mouseMixin() ],
    methods: {
      pathd(points) {
        return this.line(points);
      },
  
      resetPath(e) {
        e.type = 'path';
        e.points = [];
        e.stroke = this.strokeColor;
        e.strokeWidth = this.strokeWidth;
      },
  
      /**
        * input events
        */
      onInputStart(e) {
        this.showPalette = this.showStroke = this.showLayer = false;
        this.resetPath(this.current);
        this.x0 = this.x1; this.y0 = this.y1;
        this.current.points = [[this.x1, this.y1], [this.x1, this.y1]];
      },
      onInputMove(e) {
        let points = this.current.points;
        const dx = this.x1 - this.x0;
        const dy = this.y1 - this.y0;
        if (dx * dx + dy * dy > this.strokePrecision) points.push([this.x0 = this.x1, this.y0 = this.y1]);
        else this.$set(points, points.length-1, [this.x1, this.y1]);
      },
      onInputEnd(e) {
        if (this.current.points.length>1) {
          this.layer.elements.push({ ...this.current, d: this.pathd(this.current.points) });
        }
        this.resetPath(this.current);
      },
      updateInputCoords(e) {
        this.x1 = this.vbX + this.currX * (this.vbW / this.width) - this.cx;
        this.y1 = this.vbY + this.currY * (this.vbH / this.height) - this.cy;
      },
  
      /**
        * misc events
        */
      onResize() {
        const r = this.$refs.svg.getBoundingClientRect();
        this.width = r.width;
        this.height = r.height;
        this.cx = r.width / 2;
        this.cy = r.height / 2;
        this.updateViewBox();
      },
      onMouseWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) this.zoomIn();
        else this.zoomOut();
      },
      zoomIn() {
        this.zoom = Math.min(195, this.zoom + 5);
        this.updateViewBox();
      },
      zoomOut() {
        this.zoom = Math.max(5, this.zoom - 5);
        this.updateViewBox();
      },
      updateViewBox() {
        this.vbX = ((this.width * this.zoom / 100) - this.width) / 2;
        this.vbY = ((this.height * this.zoom / 100) - this.height) / 2;
        this.vbW = this.width - 2 * this.vbX;
        this.vbH = this.height - 2 * this.vbY;
        this.viewBox = this.vbX + ' ' + this.vbY + ' ' + this.vbW + ' ' + this.vbH;
      },
  
      onKeyUp(e) {
        if (e.ctrlKey && e.keyCode==90) {
          this.onCtrlZ();
        }
      },
      onCtrlZ() {
        this.layer.elements.pop();
      },
      onReset() {
        this.layer.elements = [];
      },
  
      /**
        * misc
        */
      estyle(e) {
        return {
          stroke: e.stroke,
          'stroke-width': e.strokeWidth,
        };
      },
      rotatePart(i, n) {
        return this.rotate(i * 360 / n);
      },
      translate(x, y) {
        return 'translate(' + x + ', ' + y + ')';
      },
      rotate(r) {
        return 'rotate(' + r + ')';
      }
    }
  });
  
  function mouseMixin() {
    return {
      created() {
        this.mouseDown = false;
        this.touchDown = false;
      },
      methods: {
        /**
          * mouse events
          */
        onMouseDown(e) {
          if (e.which == 1) {
            this.mouseDown = true;
            this.updateMouseCoords(e);
            this.onInputStart(e);
          }
        },
        onMouseMove(e) {
          if (this.mouseDown) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.updateMouseCoords(e);
            this.onInputMove(e);
          }
        },
        onMouseEnd(e) {
          if (this.mouseDown) {
            this.mouseDown = false;
            this.onInputEnd(e);
          }
        },
        updateMouseCoords(e) {
          var clientRect = e.target.getBoundingClientRect();
          this.currX = e.clientX - clientRect.left;
          this.currY = e.clientY - clientRect.top;
          this.updateInputCoords(e);
        },
  
        /**
          * touch events
          */
        onTouchStart(e) {
          e.preventDefault();
          this.touchDown = true;
          this.updateTouchCoords(e);
          this.onInputStart(e);
        },
        onTouchMove(e) {
          if (this.touchDown) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.updateTouchCoords(e);
            this.onInputMove(e);
          }
        },
        onTouchEnd(e) {
          if (this.touchDown) {
            e.preventDefault();
            this.touchDown = false;
            this.onInputEnd(e);
          }
        },
        updateTouchCoords(e) {
          var clientRect = e.target.getBoundingClientRect();
          this.currX = e.changedTouches[0].clientX - clientRect.left;
          this.currY = e.changedTouches[0].clientY - clientRect.top;
          this.updateInputCoords(e);
        }
      }
    };
  }
  
  function rnd(max, negative) {
    return negative ? Math.random() * 2 * max - max : Math.random() * max;
  }
  