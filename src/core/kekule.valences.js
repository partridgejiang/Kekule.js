/**
 * @fileoverview
 * This file helps to determine the valence of a neutral, anion(-) or cation(+) atom.
 * @author Partridge Jiang
 */

/**
 * A class to help to determinate the valence of atom, especially with charge.
 * @class
 */
Kekule.ValenceUtils = {
	/**
	 * Returns possible valence according to atomic number and charge.
	 * @param {Int} atomicNumber
	 * @param {Int} charge
	 * @returns {Hash} A special hash containing fields {valences: array, valenceElectronCount: int(in no charge form), unexpectedCharge: a special flag, indicating that the input charge is not a normal one}
	 */
	getPossibleMdlValenceInfo: function(atomicNumber, charge)
	{
		var q = Math.round(charge);
		var valences = [];
		var valenceElectronCount = 0;
		var unexpectedCharge = false;
		var result = {};

		switch (atomicNumber) {
		  case 1: // H
		  case 3: // Li
		  case 11: // Na
		  case 19: // K
		  case 37: // Rb
		  case 55: // Cs
		  case 87: // Fr
		    if (q === 0)
			    valences = [1];
		    else if (q === 1)
			    valences = [0];
		    else
			    unexpectedCharge = true;
			  valenceElectronCount = 1;
		    break;

		  case 4: // Be
		  case 12: // Mg
		  case 20: // Ca
		  case 38: // Sr
		  case 56: // Ba
		  case 88: // Ra
		    switch (q) {
			    case 0: valences = [2]; break;
			    case 1: valences = [1]; break;
			    case 2: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 2;
		    break;

		  case 5: // B
		    switch (q) {
			    case -4: valences = [1]; break;
			    case -3: valences = [2]; break;
			    case -2: valences = [3, 5]; break;
			    case -1: valences = [4]; break;
			    case 0: valences = [3]; break;
			    case 1: valences = [2]; break;
			    case 2: valences = [1]; break;
			    case 3: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 3;
		    break;

		  case 6: // C
		    switch (q) {
			    case -4: valences = [0]; break;
			    case -3: valences = [1]; break;
			    case -2: valences = [2]; break;
			    case -1: valences = [3, 5]; break;
			    case 0: valences = [4]; break;
			    case 1: valences = [3]; break;
			    case 2: valences = [2]; break;
			    case 3: valences = [1]; break;
			    case 4: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 4;
		    break;

		  case 7: // N
		    switch (q) {
			    case -3: valences = [0]; break;
			    case -2: valences = [1]; break;
			    case -1: valences = [2]; break;
			    case 0: valences = [3, 5]; break;
			    case 1: valences = [4]; break;
			    case 2: valences = [3]; break;
			    case 3: valences = [2]; break;
			    case 4: valences = [1]; break;
			    case 5: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 5;
		    break;

		  case 8: // O
		    switch (q) {
			    case -2: valences = [0]; break;
			    case -1: valences = [1]; break;
			    case 0: valences = [2]; break;
			    case 1: valences = [3, 5]; break;
			    case 2: valences = [4]; break;
			    case 3: valences = [3]; break;
			    case 4: valences = [2]; break;
			    case 5: valences = [1]; break;
			    case 6: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 6;
		    break;

		  case 9: // F
		    switch (q) {
			    case -1: valences = [0]; break;
			    case 0: valences = [1]; break;
			    case 1: valences = [2]; break;
			    case 2: valences = [3, 5]; break;
			    case 3: valences = [4]; break;
			    case 4: valences = [3]; break;
			    case 5: valences = [2]; break;
			    case 6: valences = [1]; break;
			    case 7: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 7;
		    break;

		  case 13: // Al
		    switch (q) {
			    case -4: valences = [1, 3, 5, 7]; break;
			    case -3: valences = [2, 4, 6]; break;
			    case -2: valences = [3, 5]; break;
			    case -1: valences = [4]; break;
			    case 0: valences = [3]; break;
			    case 1: valences = [2]; break;
			    case 2: valences = [1]; break;
			    case 3: valences = [0]; break;
			    default: unexpectedCharge = true; break;
		    }
			  valenceElectronCount = 3;
		    break;

		  case 14: // Si
		    switch (q) {
			    case -4: valences = [0]; break;
			    case -3: valences = [1, 3, 5, 7]; break;
			    case -2: valences = [2, 4, 6]; break;
			    case -1: valences = [3, 5]; break;
			    case 0: valences = [4]; break;
			    case 1: valences = [3]; break;
			    case 2: valences = [2]; break;
			    case 3: valences = [1]; break;
			    case 4: valences = [0]; break;
		    }
			  valenceElectronCount = 4;
		    break;

		  case 15: // P
		    switch (q) {
			    case -3: valences = [0]; break;
			    case -2: valences = [1, 3, 5, 7]; break;
			    case -1: valences = [2, 4, 6]; break;
			    case 0: valences = [3, 5]; break;
			    case 1: valences = [4]; break;
			    case 2: valences = [3]; break;
			    case 3: valences = [2]; break;
			    case 4: valences = [1]; break;
			    case 5: valences = [0]; break;
		    }
			  valenceElectronCount = 5;
		    break;

		  case 16: // S
		    switch (q) {
			    case -2: valences = [0]; break;
			    case -1: valences = [1, 3, 5, 7]; break;
			    case 0: valences = [2, 4, 6]; break;
			    case 1: valences = [3, 5]; break;
			    case 2: valences = [4]; break;
			    case 3: valences = [3]; break;
			    case 4: valences = [2]; break;
			    case 5: valences = [1]; break;
			    case 6: valences = [0]; break;
		    }
			  valenceElectronCount = 6;
		    break;

		  case 17: // Cl
		    switch (q) {
			    case -1: valences = [0]; break;
			    case 0: valences = [1, 3, 5, 7]; break;
			    case 1: valences = [2, 4, 6]; break;
			    case 2: valences = [3, 5]; break;
			    case 3: valences = [4]; break;
			    case 4: valences = [3]; break;
			    case 5: valences = [2]; break;
			    case 6: valences = [1]; break;
			    case 7: valences = [0]; break;
		    }
			  valenceElectronCount = 7;
		    break;

			case 31: // Ga
				switch (q) {
					case -4: valences = [1, 3, 5, 7]; break;
					case -3: valences = [2, 4, 6]; break;
					case -2: valences = [3, 5]; break;
					case -1: valences = [4]; break;
					case 0: valences = [3]; break;
					case 2: valences = [1]; break;
					case 3: valences = [0]; break;
					default: unexpectedCharge = true; break;
				}
				valenceElectronCount = 3;
				break;

		  case 32: // Ge
		    switch (q) {
			    case -4: valences = [0]; break;
			    case -3: valences = [1, 3, 5, 7]; break;
			    case -2: valences = [2, 4, 6]; break;
			    case -1: valences = [3, 5]; break;
			    case 0: valences = [4]; break;
			    case 1: valences = [3]; break;
			    case 3: valences = [1]; break;
			    case 4: valences = [0]; break;
		    }
			  valenceElectronCount = 4;
		    break;

		  case 33: // As
		    switch (q) {
			    case -3: valences = [0]; break;
			    case -2: valences = [1, 3, 5, 7]; break;
			    case -1: valences = [2, 4, 6]; break;
			    case 0: valences = [3, 5]; break;
			    case 1: valences = [4]; break;
			    case 2: valences = [3]; break;
			    case 4: valences = [1]; break;
			    case 5: valences = [0]; break;
		    }
			  valenceElectronCount = 5;
		    break;

			case 34: // Se
		    switch (q) {
			    case -2: valences = [0]; break;
			    case -1: valences = [1, 3, 5, 7]; break;
			    case 0: valences = [2, 4, 6]; break;
			    case 1: valences = [3, 5]; break;
			    case 2: valences = [4]; break;
			    case 3: valences = [3]; break;
			    case 5: valences = [1]; break;
			    case 6: valences = [0]; break;
		    }
			  valenceElectronCount = 6;
		    break;

			case 35: // Br
		    switch (q) {
			    case -1: valences = [0]; break;
			    case 0: valences = [1, 3, 5, 7]; break;
			    case 1: valences = [2, 4, 6]; break;
			    case 2: valences = [3, 5]; break;
			    case 3: valences = [4]; break;
			    case 4: valences = [3]; break;
			    case 6: valences = [1]; break;
			    case 7: valences = [0]; break;
		    }
			  valenceElectronCount = 7;
		    break;

		  case 49: // In
				switch (q) {
					case -4: valences = [1, 3, 5, 7]; break;
					case -3: valences = [2, 4, 6]; break;
					case -2: valences = [3, 5]; break;
					case -1: valences = [4]; break;
					case 0: valences = [3]; break;
					case 2: valences = [1]; break;
					case 3: valences = [0]; break;
					default: unexpectedCharge = true; break;
				}
				valenceElectronCount = 3;
				break;

			case 50: // Sn
			case 82: // Pb
		    switch (q) {
			    case -4: valences = [0]; break;
			    case -3: valences = [1, 3, 5, 7]; break;
			    case -2: valences = [2, 4, 6]; break;
			    case -1: valences = [3, 5]; break;
			    case 0: valences = [2, 4]; break;
			    case 1: valences = [3]; break;
			    case 3: valences = [1]; break;
			    case 4: valences = [0]; break;
		    }
			  valenceElectronCount = 4;
		    break;

			case 51: // Sb
			case 83: // Bi
		    switch (q) {
			    case -3: valences = [0]; break;
			    case -2: valences = [1, 3, 5, 7]; break;
			    case -1: valences = [2, 4, 6]; break;
			    case 0: valences = [3, 5]; break;
			    case 1: valences = [2, 4]; break;
			    case 2: valences = [3]; break;
			    case 4: valences = [1]; break;
			    case 5: valences = [0]; break;
		    }
			  valenceElectronCount = 5;
		    break;

			case 52: // Te
			case 84: // Po
		    switch (q) {
			    case -2: valences = [0]; break;
			    case -1: valences = [1, 3, 5, 7]; break;
			    case 0: valences = [2, 4, 6]; break;
			    case 1: valences = [3, 5]; break;
			    case 2: valences = [2, 4]; break;
			    case 3: valences = [3]; break;
			    case 5: valences = [1]; break;
			    case 6: valences = [0]; break;
		    }
			  valenceElectronCount = 6;
		    break;

			case 53: // I
			case 85: // At
		    switch (q) {
			    case -1: valences = [0]; break;
			    case 0: valences = [1, 3, 5, 7]; break;
			    case 1: valences = [2, 4, 6]; break;
			    case 2: valences = [3, 5]; break;
			    case 3: valences = [2, 4]; break;
			    case 4: valences = [3]; break;
			    case 6: valences = [1]; break;
			    case 7: valences = [0]; break;
		    }
			  valenceElectronCount = 7;
		    break;

			case 81: // Tl
				switch (q) {
					case -4: valences = [1, 3, 5, 7]; break;
					case -3: valences = [2, 4, 6]; break;
					case -2: valences = [3, 5]; break;
					case -1: valences = [2, 4]; break;
					case 0: valences = [1, 3]; break;
					case 3: valences = [0]; break;
					default: unexpectedCharge = true; break;
				}
				valenceElectronCount = 3;
				break;
		  }

		  if (unexpectedCharge)  // calculate the valence direct from outer shell valence electron count
		  {
		  	var eCount = valenceElectronCount - charge;
		  	if (eCount < 0 || eCount > 8)  // related to the inner shell, complex and we do not handle here
				  valences = [];
		  }

		  return {'valences': valences, 'valenceElectronCount': valenceElectronCount, 'unexpectedCharge': unexpectedCharge};
	},
	/**
	 * Returns the max possible MDL valence value.
	 * @param {Int} atomicNumber
	 * @param {Int} charge
	 * @returns {Int} Returns 0 when there is no provided value.
	 */
	getMaxPossibleMdlValence: function(atomicNumber, charge)
	{
		var valenceInfos = Kekule.ValenceUtils.getPossibleMdlValenceInfo(atomicNumber, charge);
		var valences = valenceInfos.valences;
		return valences.length? valences[valences.length - 1]: 0;
	},
	/**
	 * Returns the implicit MDL valence for element with charge and known (explicit) valence.
	 * e.g. C+ valence is 3 while C- valence is also 3.
	 * The code is copy from mdlvalence.h of OpenBabel.
	 * See https://github.com/openbabel/openbabel/blob/master/src/formats/mdlvalence.h
	 * @param {Int} atomicNumber
	 * @param {Int} charge
	 * @param {Int} explicitValence
	 * @returns {Int}
	 */
	getImplicitMdlValence: function(atomicNumber, charge, explicitValence)
	{
		var q = charge;
		var val = explicitValence;

		switch (atomicNumber) {
		  case 1: // H
		  case 3: // Li
		  case 11: // Na
		  case 19: // K
		  case 37: // Rb
		  case 55: // Cs
		  case 87: // Fr
		    if (q == 0 && val <= 1)
		      return 1;
		    break;

		  case 4: // Be
		  case 12: // Mg
		  case 20: // Ca
		  case 38: // Sr
		  case 56: // Ba
		  case 88: // Ra
		    switch (q) {
		    case 0: if (val <= 2) return 2; break;
		    case 1: if (val <= 1) return 1; break;
		    }
		    break;

		  case 5: // B
		    switch (q) {
		    case -4: if (val <= 1) return 1; break;
		    case -3: if (val <= 2) return 2; break;
		    case -2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case -1: if (val <= 4) return 4; break;
		    case 0: if (val <= 3) return 3; break;
		    case 1: if (val <= 2) return 2; break;
		    case 2: if (val <= 1) return 1; break;
		    }
		    break;

		  case 6: // C
		    switch (q) {
		    case -3: if (val <= 1) return 1; break;
		    case -2: if (val <= 2) return 2; break;
		    case -1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 0: if (val <= 4) return 4; break;
		    case 1: if (val <= 3) return 3; break;
		    case 2: if (val <= 2) return 2; break;
		    case 3: if (val <= 1) return 1; break;
		    }
		    break;

		  case 7: // N
		    switch (q) {
		    case -2: if (val <= 1) return 1; break;
		    case -1: if (val <= 2) return 2; break;
		    case 0: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 1: if (val <= 4) return 4; break;
		    case 2: if (val <= 3) return 3; break;
		    case 3: if (val <= 2) return 2; break;
		    case 4: if (val <= 1) return 1; break;
		    }
		    break;

		  case 8: // O
		    switch (q) {
		    case -1: if (val <= 1) return 1; break;
		    case 0: if (val <= 2) return 2; break;
		    case 1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 2: if (val <= 4) return 4; break;
		    case 3: if (val <= 3) return 3; break;
		    case 4: if (val <= 2) return 2; break;
		    case 5: if (val <= 1) return 1; break;
		    }
		    break;

		  case 9: // F
		    switch (q) {
		    case 0: if (val <= 1) return 1; break;
		    case 1: if (val <= 2) return 2; break;
		    case 2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 3: if (val <= 4) return 4; break;
		    case 4: if (val <= 3) return 3; break;
		    case 5: if (val <= 2) return 2; break;
		    case 6: if (val <= 1) return 1; break;
		    }
		    break;

		  case 13: // Al
		    switch (q) {
		    case -4: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -3: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case -1: if (val <= 4) return 4; break;
		    case 0: if (val <= 3) return 3; break;
		    case 1: if (val <= 2) return 2; break;
		    case 2: if (val <= 1) return 1; break;
		    }
		    break;

		  case 14: // Si
		    switch (q) {
		    case -3: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -2: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 0: if (val <= 4) return 4; break;
		    case 1: if (val <= 3) return 3; break;
		    case 2: if (val <= 2) return 2; break;
		    case 3: if (val <= 1) return 1; break;
		    }
		    break;

		  case 15: // P
		    switch (q) {
		    case -2: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 0: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 1: if (val <= 4) return 4; break;
		    case 2: if (val <= 3) return 3; break;
		    case 3: if (val <= 2) return 2; break;
		    case 4: if (val <= 1) return 1; break;
		    }
		    break;

		  case 16: // S
		    switch (q) {
		    case -1: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 0: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 2: if (val <= 4) return 4; break;
		    case 3: if (val <= 3) return 3; break;
		    case 4: if (val <= 2) return 2; break;
		    case 5: if (val <= 1) return 1; break;
		    }
		    break;

		  case 17: // Cl
		    switch (q) {
		    case 0: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 3: if (val <= 4) return 4; break;
		    case 4: if (val <= 3) return 3; break;
		    case 5: if (val <= 2) return 2; break;
		    case 6: if (val <= 1) return 1; break;
		    }
		    break;

		  case 31: // Ga
		    switch (q) {
		    case -4: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -3: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case -1: if (val <= 4) return 4; break;
		    case 0: if (val <= 3) return 3; break;
		    case 2: if (val <= 1) return 1; break;
		    }
		    break;

		  case 32: // Ge
		    switch (q) {
		    case -3: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -2: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 0: if (val <= 4) return 4; break;
		    case 1: if (val <= 3) return 3; break;
		    case 3: if (val <= 1) return 1; break;
		    }
		    break;

		  case 33: // As
		    switch (q) {
		    case -2: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 0: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 1: if (val <= 4) return 4; break;
		    case 2: if (val <= 3) return 3; break;
		    case 4: if (val <= 1) return 1; break;
		    }
		    break;

		  case 34: // Se
		    switch (q) {
		    case -1: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 0: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 2: if (val <= 4) return 4; break;
		    case 3: if (val <= 3) return 3; break;
		    case 5: if (val <= 1) return 1; break;
		    }
		    break;

		  case 35: // Br
		    switch (q) {
		    case 0: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 3: if (val <= 4) return 4; break;
		    case 4: if (val <= 3) return 3; break;
		    case 6: if (val <= 1) return 1; break;
		    }
		    break;

		  case 49: // In
		    switch (q) {
		    case -4: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -3: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case -1: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 0: if (val <= 3) return 3; break;
		    case 2: if (val <= 1) return 1; break;
		    }
		    break;

		  case 50: // Sn
		  case 82: // Pb
		    switch (q) {
		    case -3: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -2: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 0: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 1: if (val <= 3) return 3; break;
		    case 3: if (val <= 1) return 1; break;
		    }
		    break;

		  case 51: // Sb
		  case 83: // Bi
		    switch (q) {
		    case -2: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 0: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 1: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 2: if (val <= 3) return 3; break;
		    case 4: if (val <= 1) return 1; break;
		    }
		    break;

		  case 52: // Te
		  case 84: // Po
		    switch (q) {
		    case -1: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 0: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 1: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 2: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 3: if (val <= 3) return 3; break;
		    case 5: if (val <= 1) return 1; break;
		    }
		    break;

		  case 53: // I
		  case 85: // At
		    switch (q) {
		    case 0: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case 1: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case 2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case 3: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 4: if (val <= 3) return 3; break;
		    case 6: if (val <= 1) return 1; break;
		    }
		    break;

		  case 81: // Tl
		    switch (q) {
		    case -4: if (val <= 1) return 1;
		              if (val <= 3) return 3;
		              if (val <= 5) return 5;
		              if (val <= 7) return 7; break;
		    case -3: if (val <= 2) return 2;
		              if (val <= 4) return 4;
		              if (val <= 6) return 6; break;
		    case -2: if (val <= 3) return 3;
		              if (val <= 5) return 5; break;
		    case -1: if (val <= 2) return 2;
		              if (val <= 4) return 4; break;
		    case 0: if (val <= 1) return 1;
		              if (val <= 3) return 3; break;
		    }
		    break;

		  }
		  return val;
	},

	/**
	 * Returns the implicit HYD valence for element with charge and known (explicit) valence.
	 * The code is copy from mdlvalence.h of OpenBabel.
	 * See https://github.com/openbabel/openbabel/blob/master/src/formats/mdlvalence.h
	 * @param {Int} atomicNumber
	 * @param {Int} charge
	 * @param {Int} explicitValence
	 * @returns {Int}
	 */
	getImplicitHydValence: function(atomicNumber, charge, explicitValence)
	{
		var elem = atomicNumber;
		var q = charge;
		var val = explicitValence;

	  var impval = 0;
	  if (elem == 6) { // C
	    impval = 4 - Math.abs(q);
	  } else if (elem == 7 || elem == 15) { // N or P
	    impval = 3 + q;
	  } else if (elem == 8 || elem == 16) { // O or S
	    impval = 2 + q;
	  }
	  if (impval < 0) {
	    impval = 0;
	  }
	  if (val > impval) {
	    impval = val;
	  }
	  return impval;
	}
};

// defaultly the valence determination method is MDL.
Kekule.ValenceUtils.getImplicitValence = Kekule.ValenceUtils.getImplicitMdlValence;
Kekule.ValenceUtils.getMaxPossibleValence = Kekule.ValenceUtils.getMaxPossibleMdlValence;
