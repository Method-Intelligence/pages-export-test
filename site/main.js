const panels = [...document.querySelectorAll('.panel')];
const stage = document.querySelector('#stage');
const holder = document.querySelector('#panels');
const selector = document.querySelector('#category');
const rows = [['Software',48,21,21],['Installation',32,22,16],['Training',20,4,10]];
const data = rows.flatMap(([category,,q1,q2]) => [{category,quarter:'Q1',cost:q1},{category,quarter:'Q2',cost:q2}]);
function describe(category) {
  selector.value = category;
  const selected = rows.filter(row => !category || row[0] === category);
  const totals = [2,3].map(i => selected.reduce((total,row) => total + row[i],0));
  document.querySelector('#summary').textContent = (category || 'All categories') + ': Q1 $' + totals[0] + 'k · Q2 $' + totals[1] + 'k';
}
selector.addEventListener('change', () => describe(selector.value));
async function renderPanel(id, draw) {
  const target = document.getElementById(id);
  try { await draw(target); target.dataset.ready = 'true'; }
  catch (error) {
    console.error(id,error);
    const note = document.createElement('p');
    note.textContent = 'Graphic unavailable. See the figures and approval steps below.';
    target.after(note);
  }
}
renderPanel('budget', canvas => new Chart(canvas,{
  type:'bar',data:{labels:rows.map(r=>r[0]),datasets:[
    {label:'Baseline',data:rows.map(r=>r[1]),backgroundColor:'#7996ce',borderRadius:5},
    {label:'Proposed',data:rows.map(r=>r[2]+r[3]),backgroundColor:'#63e1c8',borderRadius:5}
  ]},options:{animation:false,maintainAspectRatio:false,color:'#e9f1ff',scales:{x:{ticks:{color:'#e9f1ff'},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#e9f1ff'},grid:{color:'#385274'},title:{display:true,text:'USD thousands',color:'#e9f1ff'}}}}
}));
renderPanel('flow',async target => {
  mermaid.initialize({startOnLoad:false,securityLevel:'strict',flowchart:{htmlLabels:false},theme:'dark'});
  const result = await mermaid.render('approvalRoute', 'flowchart TD\n A[Submit proposal] --> B{Finance approves?}\n B -->|Revise| C[Update proposal]\n C --> A\n B -->|Approve| D[Sponsor sign-off]');
  target.innerHTML = result.svg;
});
renderPanel('vega',async target => {
  const cost={field:'cost',type:'quantitative',aggregate:'sum',title:'USD thousands'};
  const spec={data:{values:data},background:'transparent',spacing:12,config:{axis:{labelColor:'#e9f1ff',titleColor:'#e9f1ff',gridColor:'#385274'},title:{color:'#e9f1ff'},view:{stroke:null}},vconcat:[
    {title:'Proposed total by category',width:220,height:78,params:[{name:'picked',select:{type:'point',fields:['category'],toggle:false}}],mark:{type:'bar',cursor:'pointer'},encoding:{x:cost,y:{field:'category',type:'nominal',title:null},color:{condition:{param:'picked',value:'#b8a8ff'},value:'#66668e'}}},
    {title:'Quarterly cost for selection',width:220,height:90,transform:[{filter:{param:'picked'}}],mark:{type:'bar',color:'#63e1c8'},encoding:{x:{field:'quarter',type:'ordinal',title:null},y:{...cost,scale:{domain:[0,50]}}}}
  ]};
  const runtime=vega.parse(vegaLite.compile(spec).spec,null,{ast:true});
  const view=new vega.View(runtime,{expr:MidomVegaInterpreter.expressionInterpreter,renderer:'svg',container:target});
  view.addSignalListener('picked',(_,value)=>describe(value?.category?.[0] || ''));
  await view.runAsync();
  selector.addEventListener('change',async () => {
    const value=selector.value;
    const update=vega.changeset().remove(()=>true);
    if(value) update.insert({unit:'concat_0',fields:[{type:'E',field:'category'}],values:[value]});
    await view.change('picked_store',update).runAsync();
  });
});
async function gallery() {
  const base='../libraries/three-0.180.0-addons-v1/';
  const [THREE,{CSS3DRenderer,CSS3DObject},{OrbitControls}]=await Promise.all([
    import(base+'three.module.min.js'),import(base+'renderers/CSS3DRenderer.js'),import(base+'controls/OrbitControls.js')
  ]);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,1,6000);
  const renderer=new CSS3DRenderer();
  stage.append(renderer.domElement);
  const orbit=new OrbitControls(camera,renderer.domElement);
  orbit.enableZoom=false;
  orbit.enablePan=false;
  orbit.minPolarAngle=0.65;
  orbit.maxPolarAngle=1.65;
  const objects=panels.map((panel,i)=>{
    const obj=new CSS3DObject(panel);
    obj.position.set((i-1)*455,i===1?35:0,i===1?-160:10);
    obj.rotation.y=(1-i)*0.35;
    scene.add(obj);
    return obj;
  });
  const views=[...document.querySelectorAll('[data-view]')];
  const flat=document.querySelector('#flat');
  let current='all';
  let surfaceParent;
  function render(){renderer.render(scene,camera);}
  function frame(){
    if(!stage.clientWidth) return;
    const width=stage.clientWidth,height=stage.clientHeight;
    renderer.setSize(width,height);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    if(current==='all'){
      orbit.target.set(0,0,-35);
      camera.position.set(135,300,Math.max(1050,2050*height/width));
    }else{
      const obj=objects[Number(current)];
      orbit.target.copy(obj.position);
      const distance=Math.max(660,620*height/width);
      camera.position.copy(obj.position).add(new THREE.Vector3(0,0,distance).applyEuler(obj.rotation));
    }
    orbit.update(); render();
  }
  function setFlat(isFlat){
    document.body.classList.toggle('scene',!isFlat);
    flat.setAttribute('aria-pressed',String(isFlat));
    if(isFlat) {
      if (stage.contains(panels[0])) surfaceParent=panels[0].parentElement;
      panels.forEach(panel=>holder.append(panel));
    }
    else {
      if (surfaceParent && stage.contains(surfaceParent)) panels.forEach(panel => surfaceParent.append(panel));
      frame();
      if (stage.contains(panels[0])) surfaceParent = panels[0].parentElement;
    }
  }
  orbit.addEventListener('change',render);
  views.forEach(button=>button.addEventListener('click',()=>{
    current=button.dataset.view;
    views.forEach(view=>view.setAttribute('aria-pressed',String(view===button)));
    setFlat(false);
  }));
  flat.addEventListener('click',()=>setFlat(flat.getAttribute('aria-pressed')!=='true'));
  new ResizeObserver(frame).observe(stage);
  setFlat(false);
  stage.dataset.ready='true';
}
gallery().catch(error=>{console.error(error);document.querySelector('nav').hidden=true;});