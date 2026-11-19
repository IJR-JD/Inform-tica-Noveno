/* Original interactive SVG diagrams for IJR Informatics 9; fully self-contained. */
(function(){
"use strict";
const shell=(body,description)=>'<svg viewBox="0 0 520 265" role="img" aria-label="'+description.replace(/"/g,'&quot;')+'" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="518" height="263" fill="#fafafa" stroke="#ddd"/>'+body+'</svg>';
const txt=(x,y,str,more='')=>'<text x="'+x+'" y="'+y+'" class="v-text" '+more+'>'+str+'</text>';
const rect=(x,y,w,h,more='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" '+more+'/>';
const line=(x1,y1,x2,y2,more='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" '+more+'/>';
const arrow=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,'class="v-arrow" marker-end="url(#vArrow)"');
const defs='<defs><marker id="vArrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#111" stroke-width="1.2"/></marker></defs>';
const cube='<g class="v-rotor"><polygon points="198,86 264,48 336,86 269,126" class="v-top"/><polygon points="198,86 269,126 269,205 198,163" class="v-front"/><polygon points="269,126 336,86 336,163 269,205" class="v-side"/></g>';
const objects=[
  shell(defs+txt(35,38,'Necesidad → boceto → prototipo → mejora')+rect(42,67,93,130,'class="v-object"')+txt(59,87,'NECESIDAD')+rect(159,92,90,90,'class="v-guide"')+line(176,157,225,111,'class="v-outline"')+rect(277,107,82,65,'class="v-object v-rise"')+rect(303,73,35,65,'class="v-phone v-bob"')+rect(389,107,82,65,'class="v-object"')+rect(415,73,35,65,'class="v-phone"')+arrow(139,142,155,142)+arrow(253,142,273,142)+arrow(363,142,385,142)+txt(175,214,'Boceto')+txt(287,214,'Prueba')+txt(394,214,'Ajuste'),'Secuencia ilustrativa del proceso de diseño: necesidad, boceto, prototipo y ajuste'),
  shell(txt(29,38,'Prueba de estabilidad · observar y corregir')+line(35,213,480,213,'class="v-ground"')+rect(99,167,108,39,'class="v-object v-rock"')+rect(142,107,32,61,'class="v-phone v-rock"')+rect(305,167,115,39,'class="v-object"')+rect(347,104,32,62,'class="v-phone"')+txt(80,244,'Antes: soporte inestable')+txt(296,244,'Después: apoyo firme')+arrow(222,160,289,160),'Dos prototipos de soporte: uno se inclina durante la prueba y otro está estable'),
  shell(defs+txt(35,37,'Placa rectangular · representar antes de fabricar')+rect(126,71,255,125,'class="v-object"')+line(126,58,381,58,'class="v-dim"')+line(126,52,126,64,'class="v-dim"')+line(381,52,381,64,'class="v-dim"')+txt(232,50,'60 mm')+line(111,71,111,196,'class="v-dim"')+line(106,71,116,71,'class="v-dim"')+line(106,196,116,196,'class="v-dim"')+txt(67,137,'20 mm')+txt(193,229,'Boceto acotado'),'Boceto rectangular con cota de 60 milímetros por 20 milímetros'),
  shell(txt(35,36,'Dos alternativas · comparar criterios')+rect(63,93,165,103,'class="v-object"')+rect(95,108,101,73,'fill="#fff" stroke="#222" stroke-width="3"')+rect(286,93,165,103,'class="v-object"')+rect(314,109,109,71,'fill="#fff" stroke="#222" stroke-width="3"')+txt(101,83,'Opción A')+txt(326,83,'Opción B')+txt(64,223,'Función · estabilidad · material'),'Dos opciones de diseño con estructuras distintas para comparar estabilidad y material'),
  shell(txt(34,35,'Patrón visual: agregar dos elementos en cada paso')+[0,1,2,3].map((n)=>{const x=41+n*118;return '<g>'+Array.from({length:2+n*2},(_,i)=>'<circle cx="'+(x+16+(i%4)*18)+'" cy="'+(96+Math.floor(i/4)*23)+'" r="6" class="v-dot '+(i>=2+n*2-2?'v-bob':'')+'"/>').join('')+txt(x+22,180,String(2+n*2))+'</g>'}).join('')+txt(37,225,'Reconoce el incremento; después infiere el siguiente término.'),'Serie de conjuntos de dos cuatro seis y ocho círculos'),
  shell(defs+txt(37,37,'Operaciones booleanas · antes y después')+rect(65,102,143,93,'class="v-object"')+rect(104,68,50,128,'class="v-cutter v-rise"')+arrow(222,143,280,143)+rect(298,102,143,93,'class="v-object"')+rect(346,102,47,93,'fill="#fff" stroke="#222" stroke-width="2" stroke-dasharray="5 4"')+txt(75,223,'Base + cortador')+txt(310,223,'Resultado: cavidad'),'Cortador rectangular que atraviesa un bloque, después se muestra la cavidad resultante'),
  shell(txt(35,39,'Revisa el cierre de los contornos')+'<path d="M99 177V79H226V177H99" class="v-outline"/><path d="M317 177V79H444V139" class="v-outline"/><circle cx="444" cy="139" r="6" class="v-highlight v-pulse"/>'+txt(112,214,'Cerrado')+txt(335,214,'Abierto')+txt(39,240,'El extremo sin unir requiere revisión.'),'Comparación de contorno cerrado y abierto con extremo señalado'),
  shell(txt(34,36,'Cinco piezas · tres elementos por pieza')+Array.from({length:5},(_,i)=>{let x=29+i*97;return rect(x,74,87,128,'class="v-guide"')+[0,1,2].map((j)=>'<circle cx="'+(x+44)+'" cy="'+(101+j*37)+'" r="10" class="v-dot v-bob"/>').join('')+txt(x+25,224,'Pieza '+(i+1))}).join(''),'Cinco piezas, cada una con tres tornillos o puntos'),
  shell(txt(35,35,'Rectángulo · área como superficie ocupada')+Array.from({length:8},(_,x)=>Array.from({length:3},(_,y)=>rect(99+x*38,80+y*38,38,38,'class="v-gridcell" style="animation-delay:'+((x+y)*.09)+'s"')).join('')).join('')+txt(231,70,'8 cm')+txt(55,150,'3 cm')+txt(165,229,'8 × 3 cuadrados de 1 cm²'),'Rectángulo cuadriculado en ocho columnas y tres filas'),
  shell(txt(33,36,'Cubo · tres medidas de longitud')+'<g class="v-rotor"><polygon points="150,91 242,42 343,91 249,141" class="v-top"/><polygon points="150,91 249,141 249,220 150,170" class="v-front"/><polygon points="249,141 343,91 343,170 249,220" class="v-side"/></g>'+txt(178,191,'4 cm')+txt(286,192,'4 cm')+txt(210,84,'4 cm'),'Cubo de arista 4 centímetros, con longitud altura y profundidad'),
  shell(txt(35,37,'Radio y diámetro en una circunferencia')+'<circle cx="260" cy="141" r="92" class="v-guide"/>'+line(168,141,352,141,'class="v-dim"')+line(260,141,352,141,'class="v-thick v-pulse"')+'<circle cx="260" cy="141" r="5" fill="#111"/>'+txt(283,132,'r = 5 mm')+txt(214,242,'d = 2 · r'),'Círculo con centro, radio marcado de 5 milímetros y diámetro completo'),
  shell(txt(35,36,'Regla · equivalencia de unidades')+rect(58,91,407,80,'fill="white" stroke="#111" stroke-width="2"')+Array.from({length:21},(_,i)=>line(66+i*19.2,92,66+i*19.2,i%5===0?128:112,'class="v-dim"')).join('')+txt(60,146,'0')+txt(251,146,'10 mm')+txt(428,146,'20 mm')+line(66,190,450,190,'class="v-thick"')+txt(201,221,'2 cm = 20 mm'),'Regla con veinte divisiones milimétricas que corresponden a dos centímetros'),
  shell(defs+txt(35,37,'Orientación de los ejes cartesianos')+line(160,177,437,216,'class="v-thick"')+line(160,177,62,240,'class="v-thick"')+line(160,177,160,49,'class="v-thick"')+txt(452,222,'X')+txt(38,251,'Y')+txt(151,35,'Z')+'<g class="v-rotor"><polygon points="207,119 259,91 308,120 255,149" class="v-top"/><polygon points="207,119 255,149 255,201 207,172" class="v-front"/><polygon points="255,149 308,120 308,172 255,201" class="v-side"/></g>','Sistema XYZ con bloque en perspectiva, donde la altura corresponde al eje Z'),
  shell(defs+txt(35,34,'Cámara superior: planta del bloque')+rect(65,87,141,88,'class="v-object"')+txt(92,207,'Vista desde arriba')+arrow(258,126,295,126)+'<g class="v-camera"><polygon points="330,105 390,75 449,107 389,137" class="v-top"/><polygon points="330,105 389,137 389,191 330,157" class="v-front"/><polygon points="389,137 449,107 449,157 389,191" class="v-side"/></g>'+txt(328,226,'Sólido en 3D'),'Planta rectangular a la izquierda y bloque tridimensional a la derecha'),
  shell(txt(35,35,'Vista frontal: ancho y altura')+rect(99,73,300,121,'class="v-object"')+line(99,58,399,58,'class="v-dim"')+line(99,51,99,65,'class="v-dim"')+line(399,51,399,65,'class="v-dim"')+txt(231,48,'40 mm')+line(414,73,414,194,'class="v-dim"')+txt(433,140,'25 mm')+txt(171,233,'Profundidad: no visible'),'Vista frontal de bloque con 40 milímetros de ancho y 25 de altura; profundidad no visible'),
  shell(txt(35,35,'Rotación rígida · observa la orientación')+cube+txt(48,230,'Girar no cambia el volumen.'),'Cubo que rota suavemente, conservando las dimensiones y el volumen')
];
objects.push(
  shell(defs+txt(35,35,'Algoritmo: instrucciones en orden')+rect(52,82,118,99,'class="v-guide"')+txt(62,108,'3 pasos')+arrow(174,129,247,129)+rect(252,82,110,99,'class="v-object"')+txt(262,108,'Giro 90°')+arrow(367,129,435,129)+txt(368,178,'FIN'),'Esquema de avance seguido por un giro de noventa grados'),
  shell(txt(30,36,'Descomposición: divide para resolver')+rect(44,70,158,132,'class="v-guide"')+txt(58,100,'PROBLEMA')+arrow(208,134,257,134)+[0,1,2].map((n)=>rect(270,67+n*52,180,40,'class="v-object"')+txt(282,93+n*52,'Subtarea '+(n+1))).join(''),'Problema grande dividido en tres tareas pequeñas'),
  shell(defs+txt(32,36,'Decisión: detectar y actuar')+rect(43,88,150,100,'class="v-guide"')+txt(54,119,'¿Obstáculo?')+arrow(194,140,260,140)+rect(270,90,185,95,'class="v-object"')+txt(288,126,'Si: detener')+txt(289,155,'No: continuar'),'Condición de sensor con dos posibles acciones'),
  shell(txt(32,38,'Repetición controlada · cinco ciclos')+Array.from({length:5},(_,n)=>rect(50+n*90,95,58,65,'class="v-object v-rise"')+txt(68+n*90,183,String(n+1))).join('')+txt(115,218,'Una pieza en cada iteración'),'Cinco objetos colocados uno por cada repetición'),
  shell(txt(32,40,'Comparación de longitudes medidas')+[12,15,18].map((n,i)=>rect(80,70+i*52,n*17,27,'class="v-object"')+txt(90+n*17,90+i*52,n+' mm')).join(''),'Tres barras con valores de doce quince y dieciocho milímetros'),
  shell(txt(33,36,'Escala 1:2 · dibujo / realidad')+line(58,106,206,106,'class="v-thick"')+line(58,169,354,169,'class="v-thick"')+txt(220,111,'4 cm en plano')+txt(368,174,'8 cm reales')+txt(33,222,'La dimensión real es el doble del dibujo.'),'Segmentos de longitud uno a dos, cuatro y ocho centímetros'),
  shell(txt(30,40,'Duración de tres intentos')+[20,15,25].map((n,i)=>rect(80,82+i*48,n*11,25,'class="v-object"')+txt(92+n*11,100+i*48,n+' min')).join('')+txt(140,239,'Promedio = (20+15+25) / 3'),'Diagrama de barras con tiempos veinte quince y veinticinco minutos'),
  shell(txt(32,38,'Meta frente a medida del prototipo')+rect(60,92,200,49,'class="v-guide"')+rect(60,158,215,49,'class="v-object"')+txt(277,120,'40 mm · objetivo')+txt(289,184,'43 mm · real')+txt(32,243,'Diferencia: exceso de 3 mm'),'Dos barras de cuarenta y cuarenta y tres milímetros')
);
const caption=[
 "Necesidad → boceto → prueba → ajuste","Simula una prueba de estabilidad","Primero mide, después modela","Compara alternativas según criterios","Encuentra la regla de la secuencia","La perforación requiere una secuencia","Detecta un contorno abierto","Agrupa y cuenta elementos","Cuenta unidades cuadradas","Reconoce las tres dimensiones","Compara radio y diámetro","Relaciona centímetros y milímetros","Relaciona posición y ejes XYZ","Analiza la vista desde arriba","Analiza la vista frontal","Gira mentalmente un sólido sin deformarlo",
 "Programa una secuencia","Divide problemas complejos","Evalúa una condición","Cuenta repeticiones","Compara longitudes","Interpreta una escala","Calcula un promedio","Contrasta meta y resultado"
];
function build(id){
 if(!Number.isInteger(id)||id<1||id>24)throw new Error("Invalid diagnostic illustration "+id);
 const section=document.createElement("section");section.className="interactive-figure";section.setAttribute("aria-label","Situación visual: "+caption[id-1]);
 const top=document.createElement("div");top.className="figure-toolbar";
 const heading=document.createElement("span");heading.textContent="SITUACIÓN VISUAL · "+String(id).padStart(2,"0");
 const button=document.createElement("button");button.type="button";button.className="figure-toggle";button.textContent="Pausar animación";button.setAttribute("aria-pressed","false");
 button.addEventListener("click",()=>{const paused=section.classList.toggle("is-paused");button.textContent=paused?"Reanudar animación":"Pausar animación";button.setAttribute("aria-pressed",paused?"true":"false")});
 top.append(heading,button);section.append(top);
 const picture=document.createElement("div");picture.className="figure-picture";picture.innerHTML=objects[id-1];section.append(picture);
 if(id===2||id===16){
  const control=document.createElement("button");control.type="button";control.className="figure-interact";
  control.textContent=id===2?"Probar inclinación del prototipo":"Girar el cubo 90°";
  let toggled=false;
  control.addEventListener("click",()=>{
   toggled=!toggled;section.classList.toggle("is-interacted",toggled);
   control.setAttribute("aria-pressed",String(toggled));
   control.textContent=id===2?(toggled?"Restablecer prototipo":"Probar inclinación del prototipo"):(toggled?"Restablecer orientación":"Girar el cubo 90°");
  });
  control.setAttribute("aria-pressed","false");section.append(control);
 }
 const desc=document.createElement("p");desc.className="figure-caption";desc.textContent=caption[id-1]+". Observa la situación antes de responder.";section.append(desc);
 return section;
}
window.IJRVisuals={build,count:objects.length};
})();