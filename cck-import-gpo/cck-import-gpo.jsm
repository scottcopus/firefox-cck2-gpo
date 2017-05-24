// cck-import-gpo.jsm
// loads GPO settings from registry (HKLM:\Software\Policies\Mozilla\Firefox) into a cck_config_GPO variable (this file)
// and merges them into the CCK 'config' settings variable (in main cck2.cfg file)
//
// 2017-05-01: Scott.Copus@wku.edu - script born

var EXPORTED_SYMBOLS = ["cck_config_GPO"];

var supportsAlertPrompts = false;
try {
	// load this to support 'Services.prompt.alert'
	Components.utils.import("resource://gre/modules/Services.jsm");
	supportsAlertPrompts = true;
} catch (ex) {
}

function displayMessage(alertMessage) {
	const alertTitle = "Firefox autoconfig warning";
	const alertMessagePrefix = "";
	if (supportsAlertPrompts) {
		Services.prompt.alert(null, alertTitle, alertMessagePrefix + alertMessage);
	}
};

function readRegistryValue(registry, valueName) {
	var regData = {};
	regData.Error = null;
	regData.Name = valueName;
	try {
		regData.Type = registry.getValueType(valueName);
		switch (regData.Type) {
			case registry.TYPE_STRING:
				regData.Value = registry.readStringValue(valueName);
				return regData;
			case registry.TYPE_BINARY:
				regData.Value = registry.readBinaryValue(valueName);
				return regData;
			case registry.TYPE_INT:
				regData.Value = registry.readIntValue(valueName);
				return regData;
			case registry.TYPE_INT64:
				regData.Value = registry.readInt64Value(valueName);
				return regData;
			default:
				var unsupportedRegType = "unknown";
				if (regData.Type == 2) { unsupportedRegType = "REG_EXPAND_SZ" }
				if (regData.Type == 7) { unsupportedRegType = "REG_MULTI_SZ" }
				regData.Error = "Unsupported registry type (" + unsupportedRegType + ")";
				return regData;
		}
	} catch (ex) {
		regData.Error = "Failed to read registry value";
		return regData;
	}
};

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

function convertRegData(regData) {
	switch (regData.Type) {
		case registry.TYPE_STRING:
			// convert special strings to other object data types
			if (regData.Value.toLowerCase() == "true") { return true }
			if (regData.Value.toLowerCase() == "false") { return false }
			if (regData.Value.toUpperCase().substring(0,5) == "JSON:") {
				// convert JSON string to object
				try {
					// parse all data after "JSON:"
					return JSON.parse(regData.Value.substring(5));
				} catch (ex) {
					displayMessage("Couldn't parse JSON data for setting '" + regData.Name + "':\n\n" + ex.message);
				}
			}
			if (isNumeric(regData.Value) ) {
				// if it looks numeric try to convert it to a number
				try {
					return parseInt(regData.Value);
				} catch (ex) {
					displayMessage("Couldn't parse INT data for setting '" + regData.Name + "'.");
				}
			}
			// default return it as a string
			return regData.Value;
		
		case registry.TYPE_INT:
		case registry.TYPE_INT64:
			switch (regData.Value) {
				// convert special numbers to true/false data type
				case 999001:
					return true;
				case 999009:
					return false;
				default:
					return regData.Value;
			}
		
		case registry.TYPE_BINARY:  // ?
			return regData.Value;
	}
	return null;
};

function readGPOSettings(registry, registryHive, registryPath) {
	var cck_config_GPO = {};
	try {
		registry.open(registryHive, registryPath, registry.ACCESS_READ);
	} catch (ex) {
		return null;
	}
	// read all registry values under this key
	for(var i = 0; i < registry.valueCount; i++) {
		var settingName = registry.getValueName(i);
		// process only registry key settings named cck.config.*
		if (settingName.startsWith("cck.config.")) {
			//displayMessage("before readRegistryValue() for " + settingName);
			var regData = readRegistryValue(registry, settingName);
			if (regData.Error == null) {
				// remove the 'cck.config.' prefix, convert the registry data to other data types if necessary,
				// and add it to our list of cck config settings to import later
				//displayMessage("before convertRegData() for " + regData.Name);
				cck_config_GPO[settingName.replace(/^cck\.config\./, "")] = convertRegData(regData);
			} else {
				displayMessage(regData.Error + " for setting '" + regData.Name + "'");
			}
		}
	}
	registry.close();
	return cck_config_GPO;
};

var registry = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance(Components.interfaces.nsIWindowsRegKey);
var cck_config_GPO = readGPOSettings(registry, registry.ROOT_KEY_LOCAL_MACHINE, "Software\\Policies\\Mozilla\\Firefox");
//Services.prompt.alert(null, "Firefox autoconfig DEBUG", "cck_config_GPO internal:\n" + JSON.stringify(cck_config_GPO));
