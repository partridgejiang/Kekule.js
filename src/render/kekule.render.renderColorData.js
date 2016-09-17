/**
 * @fileoverview
 * Some predefined data used by 3D renderer.
 * @author Partridge Jiang
 */

(function(){

var R = Kekule.Render;

/**
 *  Different set of atom colors used by 3D renderer.
 *  Each set is an array, a[atomicNumber] = color. a[0] is used for default color for non atom nodes.
 *  @ignore
 */
R.atomColorSets = {
	// jMol color set, generated from jmol source file
	jmol: ['#000099',"#FFFFFF","#D9FFFF","#CC80FF","#C2FF00","#FFB5B5","#909090","#3050F8","#FF0D0D","#90E050","#B3E3F5","#AB5CF2","#8AFF00","#BFA6A6","#F0C8A0","#FF8000","#FFFF30","#1FF01F","#80D1E3","#8F40D4","#3DFF00","#E6E6E6","#BFC2C7","#A6A6AB","#8A99C7","#9C7AC7","#E06633","#F090A0","#50D050","#C88033","#7D80B0","#C28F8F","#668F8F","#BD80E3","#FFA100","#A62929","#5CB8D1","#702EB0","#00FF00","#94FFFF","#94E0E0","#73C2C9","#54B5B5","#3B9E9E","#248F8F","#0A7D8C","#006985","#C0C0C0","#FFD98F","#A67573","#668080","#9E63B5","#D47A00","#940094","#429EB0","#57178F","#00C900","#70D4FF","#FFFFC7","#D9FFC7","#C7FFC7","#A3FFC7","#8FFFC7","#61FFC7","#45FFC7","#30FFC7","#1FFFC7","#00FF9C","#00E675","#00D452","#00BF38","#00AB24","#4DC2FF","#4DA6FF","#2194D6","#267DAB","#266696","#175487","#D0D0E0","#FFD123","#B8B8D0","#A6544D","#575961","#9E4FB5","#AB5C00","#754F45","#428296","#420066","#007D00","#70ABFA","#00BAFF","#00A1FF","#008FFF","#0080FF","#006BFF","#545CF2","#785CE3","#8A4FE3","#A136D4","#B31FD4","#B31FBA","#B30DA6","#BD0D87","#C70066","#CC0059","#D1004F","#D90045","#E00038","#E6002E","#EB0026","#000000","#000000"],
	// CPK color map in CDK
	cpk2D: [
		'#000000',  // default
		'#000000',  // H
		'#FFC0CB',  // He
		'#B22222',  // Li
		null,       // Be
		'#00FF00',  // B
		'#000000',  // C
		'#8F8FFF',  // N
		'#F00000',  // O
		'#DAA520',  // F
		null,       // Ne
		'#0000FF',  // Na
		'#228B22',  // Mg
		'#808090',  // Al
		'#DAA520',  // Si
		'#FFA500',  // P
		'#FFC832',  // S
		'#00FF00',  // Cl
		null,       // Ar
		'#0000FF',  // K, note: this value is not set in original CPK
		'#808090',  // Ca
		'#808090',  // Sc, note: this value is not set in original CPK
		'#808090',  // Ti
		'#808090',  // V, note: this value is not set in original CPK
		'#808090',  // Cr
		'#808090',  // Mn
		'#FFA500',  // Fe
		'#A52A2A',  // Co, note: this value is not set in original CPK
		'#A52A2A',  // Ni
		'#A52A2A',  // Cu
		'#A52A2A'  // Zn
	]
};

var a = R.atomColorSets.cpk2D;
var j = R.atomColorSets.jmol;
a[35] = '#A52A2A';  // Br
a[47] = '#808090';  // Ag
a[53] = '#A020F0';  // I
a[56] = '#FFA500';  // Ba
a[79] = '#DAA520';  // Au

a['SubGroup'] = j['SubGroup'] = '#0000CC';	 // additional for none-atom nodes

/**
 * Current used color set.
 * @ignore
 */
R.atom3DColors = Kekule.Render.atomColorSets.jmol;
R.atom2DColors = Kekule.Render.atomColorSets.cpk2D;

R.atomColors = [];
R.atomColors[R.RendererType.R2D] = R.atom2DColors;
R.atomColors[R.RendererType.R3D] = R.atom3DColors;

})();

