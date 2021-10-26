/*
 * requires /io/jcamp/kekule.io.jcamp.base.js
 */

(function(){

"use strict";

// Add label maps of JCAMP-DX
Kekule.IO.Jcamp.Labels.addMaps([
	['JCAMPCS', 'JcampCsVersion'],
	['JCAMPDX', 'JcampDxVersion'],
	['TITLE', 'Title'],
	['DATATYPE', 'DataType'],
	['DATACLASS', 'DataClass'],
	['XUNITS', 'XUnits'],
	['YUNITS', 'YUnits'],
	['XFACTOR', 'XFactor'],
	['YFACTOR', 'YFactor'],
	['FIRSTX', 'FirstX'],
	['LASTX', 'LastX'],
	['FIRSTY', 'FirstY'],
	['MAXX', 'MaxX'],
	['MINX', 'MinX'],
	['MAXY', 'MaxY'],
	['MINY', 'MinY'],
	['DELTAX', 'DeltaX'],
	['NPOINTS', 'NPoints'],
	['XYDATA', 'XYData'],
	['XYPOINTS', 'XYPoints'],
	['PEAKASSIGNMENTS', 'PeakAssignments'],
	['PEAKTABLE', 'PeakTable'],
	['CLASS', 'Class'],
	['ORIGIN', 'Origin'],
	['OWNER', 'Owner'],
	['DATE', 'Date'],
	['TIME', 'Time'],
	['LONGDATE', 'LongDate'],
	['SOURCEREFERENCE', 'SourceReference'],
	['CROSSREFERENCE', 'CrossReference'],
	['SAMPLEDESCRIPTION', 'SampleDescription'],
	['CASNAME', 'CASName'],
	['NAMES', 'Names'],
	['MOLFORM', 'MolForm'],
	['IUPACNAME', 'IUPACName'],
	['CASREGISTRYNO', 'CASRegistryNo'],
	['WISWESSER', 'Wiswesser'],
	['BEILSTEINLAWSONNO', 'BeilsteinLawsonNo'],
	['BP', 'BP'],
	['MP', 'MP'],
	['PRESSURE', 'Pressure'],
	['TEMPERATURE', 'Temperature'],
	['STATE', 'State'],
	['REFRACTIVEINDEX', 'RefractiveIndex'],
	['DENSITY', 'Density'],
	['MW', 'MW'],
	['CONCENTRATIONS', 'Concentrations'],
	['SOLVENTNAME', 'SolventName'],
	['SPECTROMETERDATASYSTEM', 'SpectrometerDataSystem'],
	['INSTRUMENTALPARAMETERS', 'InstrumentalParameters'],
	['INSTRUMENTPARAMETERS', 'InstrumentParameters'],
	['SAMPLINGPROCEDURE', 'SamplingProcedure'],
	['RESOLUTION', 'Resolution'],
	['PATHLENGTH', 'PathLength'],
	['DATAPROCESSING', 'DataProcessing'],
	['XLABEL', 'XLabel'],
	['YLABEL', 'YLabel'],
	['AUDITTRAIL', 'AuditTrail'],
	['COMMENTS', 'Comments'],
	['END', 'END'],
	['BLOCKS', 'BLOCKS'],
	['BLOCKID', 'BLOCKID'],
	['NTUPLES', 'NTUPLES'],
	['ENDNTUPLES', 'ENDNTUPLES'],
	['PAGE', 'PAGE'],
	['DATATABLE', 'DataTable'],
	['VARDIM', 'VARDIM'],
	['VARFORM', 'VARFORM'],
	['VARNAME', 'VARNAME'],
	['VARTYPE', 'VARTYPE'],
	['FACTOR', 'Factor'],
	['FIRST', 'First'],
	['LAST', 'Last'],
	['MAX', 'Max'],
	['MIN', 'Min'],
	['SYMBOL', 'Symbol'],
	['UNITS', 'Units'],
	['.METHOD', 'EMR.Method'],	//EMR
	['.DETECTIONMODE', 'EMR.DetectionMode'],	//EMR
	['.DETECTIONMETHOD', 'EMR.DetectionMethod'],	//EMR
	['.MICROWAVEFREQUENCY1', 'EMR.MicrowaveFrequency1'],	//EMR
	['.MICROWAVEPOWER1', 'EMR.MicrowavePower1'],	//EMR
	['.MICROWAVEPHASE1', 'EMR.MicrowavePhase1'],	//EMR
	['.MICROWAVEFREQUENCY2', 'EMR.MicrowaveFrequency2'],	//EMR
	['.MICROWAVEPOWER2', 'EMR.MicrowavePower2'],	//EMR
	['.MICROWAVEPHASE2', 'EMR.MicrowavePhase2'],	//EMR
	['.MODULATIONUNIT', 'EMR.ModulationUnit'],	//EMR
	['.MODULATIONAMPLITUDE', 'EMR.ModulationAmplitude'],	//EMR
	['.MODULATIONFREQUENCY', 'EMR.ModulationFrequency'],	//EMR
	['.RECEIVERGAIN', 'EMR.ReceiverGain'],	//EMR
	['.RECEIVERHARMONIC', 'EMR.ReceiverHarmonic'],	//EMR
	['.DETECTIONPHASE', 'EMR.DetectionPhase'],	//EMR
	['.SCANTIME', 'EMR.ScanTime'],	//EMR
	['.NUMBEROFSCANS', 'EMR.NumberofScans'],	//EMR
	['.GONIOMETERANGLE', 'EMR.GoniometerAngle'],	//EMR
	['.STATICFIELD', 'EMR.StaticField'],	//EMR
	['.SCANNEDRFPOWER', 'EMR.ScannedRFPower'],	//EMR
	['.PUMPEDRFFREQUENCY1', 'EMR.PumpedRFFrequency1'],	//EMR
	['.PUMPEDRFPOWER1', 'EMR.PumpedRFPower1'],	//EMR
	['.PUMPEDRFFREQUENCY2', 'EMR.PumpedRFFrequency2'],	//EMR
	['.PUMPEDRFPOWER2', 'EMR.PumpedRFPower2'],	//EMR
	['.GRADIENTTHETA', 'EMR.GradientTheta'],	//EMR
	['.GRADIENTPHI', 'EMR.GradientPhi'],	//EMR
	['.GRADIENTSTRENGTHINTHETAPHIDIRECTION', 'EMR.GradientStrengthinThetaPhiDirection'],	//EMR
	['.GRADIENTSTRENGTHX', 'EMR.GradientStrengthX'],	//EMR
	['.GRADIENTSTRENGTHY', 'EMR.GradientStrengthY'],	//EMR
	['.GRADIENTSTRENGTHZ', 'EMR.GradientStrengthZ'],	//EMR
	['.SIMULATIONSOURCE', 'EMR.SimulationSource'],	//EMR
	['.SIMULATIONPARAMETERS', 'EMR.SimulationParameters'],	//EMR
	['.RESONATOR', 'EMR.Resonator'],	//EMR
	['.TIMECONSTANT', 'EMR.TimeConstant'],	//EMR
	['.CALIBRATIONSTANDARD', 'EMR.CalibrationStandard'],	//EMR
	['.XOFFSET', 'EMR.X_Offset'],	//EMR
	['.AVERAGES', 'IMS.Averages'],	//IMS
	['.CARRIERGAS', 'IMS.CarrierGas'],	//IMS
	['.CARRIERGASFLOW', 'IMS.CarrierGasFlow'],	//IMS
	['.CARRIERGASMOISTURE', 'IMS.CarrierGasMoisture'],	//IMS
	['.DRIFTCHAMBER', 'IMS.DriftChamber'],	//IMS
	['.DRIFTGAS', 'IMS.DriftGas'],	//IMS
	['.DRIFTGASFLOW', 'IMS.DriftGasFlow'],	//IMS
	['.ELECTRICFIELD', 'IMS.ElectricField'],	//IMS
	['.IONIZATIONCHAMBER', 'IMS.IonizationChamber'],	//IMS
	['.IONIZATIONENERGY', 'IMS.IonizationEnergy'],	//IMS
	['.IONIZATIONMODE', 'IMS.IonizationMode'],	//IMS
	['.IONIZATIONSOURCE', 'IMS.IonizationSource'],	//IMS
	['.IONPOLARITY', 'IMS.IonPolarity'],	//IMS
	['.PRESSURE', 'IMS.Pressure'],	//IMS
	['.TEMPERATURE', 'IMS.Temperature'],	//IMS
	['.REDUCEDMOBILITY', 'IMS.ReducedMobility'],	//IMS
	['.REPETITIONRATE', 'IMS.RepititionRate'],	//IMS
	['.SHUTTERGRIDPOTENTIAL', 'IMS.ShutterGridPotential'],	//IMS
	['.SHUTTEROPENINGTIME', 'IMS.ShutterOpeningTime'],	//IMS
	['.ACCELERATINGVOLTAGE', 'MS.AcceleratingVoltage'],	//MS
	['.BASEPEAK', 'MS.Basepeak'],  //MS
	['.BASEPEAKINTENSITY', 'MS.BasepeakIntensity'],	//MS
	['.MONOISOTOPICMASS', 'MS.MonoisotopicMass'],	//MS
	['.NOMINALMASS', 'MS.NominalMass'],	//MS
	['.RETENTIONTIME', 'MS.RetentionTime'],	//MS
	['.RIC', 'MS.RIC'],	//MS
	['.SCANNUMBER', 'MS.ScanNumber'],	//MS
	['.SCANRATE', 'MS.ScanRate'],	//MS
	['.SOURCETEMPERATURE', 'MS.SourceTemperature'],	//MS
	['.SPECTROMETERTYPE', 'MS.SpectrometerType'],	//MS
	['.TOTALIONCURRENT', 'MS.TotalIonCurrent'],	//MS
	['.DETECTOR', 'MS.Detector'],	//MS
	['.INLET', 'MS.Inlet'],	//MS
	['.INLETTEMPERATURE', 'MS.InletTemperature'],	//MS
	['.IONIZATIONENERGY', 'MS.IonizationEnergy'],	//MS
	['.IONIZATIONMODE', 'MS.IonizationMode'],	//MS
	['.ACQUISITIONMODE', 'NMR.AcquisitionMode'],	//NMR
	['.ACQUISITIONRANGE', 'NMR.AcquisitionRange'],	//MS
	['.ACQUISITIONTIME', 'NMR.AcquisitionTime'],	//NMR
	['.AVERAGES', 'NMR.Averages'],	//NMR
	['.COUPLINGCONSTANTS', 'NMR.CouplingConstants'],	//NMR
	['.DECOUPLER', 'NMR.Decoupler'],	//NMR
	['.DELAY', 'NMR.Delay'],	//NMR
	['.DIGITISERRES', 'NMR.DigitiserRes'],	//NMR
	['.FIELD', 'NMR.Field'],	//NMR
	['.FILTERWIDTH', 'NMR.FilterWidth'],	//NMR
	['.MASFREQUENCY', 'NMR.MASFrequency'],	//NMR
	['.MAXINTENSITY', 'NMR.MaxIntensity'],	//NMR
	['.MININTENSITY', 'NMR.MinIntensity'],	//NMR
	['.OBSERVE90', 'NMR.Observe90'],	//NMR
	['.OBSERVEFREQUENCY', 'NMR.ObserveFrequency'],	//NMR
	['.OBSERVENUCLEUS', 'NMR.ObserveNucleus'],	//NMR
	['.PHASE0', 'NMR.Phase0'],	//NMR
	['.PHASE1', 'NMR.Phase1'],	//NMR
	['.PULSESEQUENCE', 'NMR.PulseSequence'],	//NMR
	['.RELAXATIONTIMES', 'NMR.RelaxationTimes'],	//NMR
	['.SHIFTREFERENCE', 'NMR.ShiftReference'],	//NMR
	['.SOLVENTREFERENCE', 'NMR.SolventReference'],	//NMR
	['.SPINNINGRATE', 'NMR.SpinningRate'],	//NMR
	['.ZEROFILL', 'NMR.ZeroFill'],	//NMR
	['AFACTOR', 'AFactor'],
	['ALIAS', 'Alias'],
	['AUNITS', 'AUnits'],
	['FIRSTA', 'FirstA'],
	['MAXA', 'MaxA'],
	['MINA', 'MinA'],
	['DELTAR', 'DeltaR'],
	['FIRSTR', 'FirstR'],
	['LASTR', 'LastR'],
	['RADATA', 'RAData'],
	['RFACTOR', 'RFactor'],
	['RUNITS', 'RUnits'],
	['ZPD', 'ZPD'],
	['ATOMLIST', 'AtomList'],
	['BONDLIST', 'BondList'],
	['CHARGE', 'Charge'],
	['MAXRASTER', 'MaxRaster'],
	['MAXXYZ', 'MaxXYZ'],
	['RADICAL', 'Radical'],
	['STEREOCENTER', 'Stereocenter'],
	['STEREOMOLECULE', 'Stereomolecule'],
	['STEREOPAIR', 'Stereopair'],
	['XYRASTER', 'XYRaster'],
	['XYZ', 'XYZ'],
	['XYZFACTOR', 'XYZFactor'],
	['XYZSOURCE', 'XYZSource']
]);

})();