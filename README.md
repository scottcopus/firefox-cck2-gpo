# firefox-cck2-gpo

Adds group policy (GPO) support (via registry) to Mike Kaply's Firefox CCK2 customization wizard \[[1](https://mike.kaply.com/cck2/)\] \[[2](https://github.com/mkaply/cck2wizard)\].  Includes group policy template ADMX/ADML files.

This enhancement to CCK2 works by reading group policy settings from all the the registry key values under '*HKLM:\Software\Policies\Mozilla\Firefox*' and merging them into the CCK2 configuration environment. Included are group policy template ADMX/ADML files. Adding new settings is as simple as creating an equivalent '*cck.config.SETTINGNAME*' registry value (or edit the ADMX/ADML files with those settings) that matches the same '*SETTINGNAME*' inside of CCK2's "*config*" object variable. Any '*cck.config.SETTINGNAME*' defined via the GPO (or manually added to the above registry key) should override any locally defined '*SETTINGNAME*' within the CCK2's '**cck2.cfg**' file.

**Note**: If you need to add any settings that are nested into their own **object** variable (has member/child values), you need to modify the GPO template files to support them.  For example, say you need to be able to manage the "network" settings section via a GPO in the following example:

```javascript
var config = {
  "root_setting1": "root_value_1",
  "root_setting2": "root_value_2",
  "network": {
      "proxyHTTP": "proxyHTTP_value1",
      "locked": true,
      "network_settingN": "network_valueN"
  }
  "root_settingN": "root_value_N"
}
```

To support the CCK2-equivalent of the "network" settings above, edit the GPO template files to add a new "cck.config.network" policy with the following value:

```javascript
    JSON:{"proxyHTTP":"proxyHTTP_value1","locked":true,"network_settingN":"network_valueN"}
```

The existing policies for "cck.config.permissions" and "cck.config.preferences" behave this way. You can edit the GPO template files and clone one of these into your own new "cck.config.network" policy.

Installation instructions
------------------------------

**Install CCK2 into Firefox**

1. Install Mike Kaply's CCK2 extension (https://mike.kaply.com/cck2/) into Firefox. Configure a few test settings in the CCK2 extension GUI interface and "install it" by following its documentation.  After this is done, you should end up with a '**cck2.cfg**' file in your Mozilla Firefox program files folder.  Relaunching Firefox should result in those few test settings being applied.

**Add group policy support into CCK2**

2. In your Firefox program files folder (ex: C:\Program Files\Mozilla Firefox\) create a '**cck-import-gpo**' subfolder and copy '**cck-import-gpo.jsm**' into it. This is the module that extends CCK2 by reading registry settings defined via group policy settings and applying them into the CCK2.

3. Included in this repository is a sample '**cck2.cfg**' file. To make use of the GPO module from step 2, copy lines 115-140 (the indented lines) from this sample '**cck2.cfg**' file into your own '**cck2.cfg**' file generated from step 1.  You'll need to add them right ABOVE your last line containing "*CCK2.init(...*".

**Create group policy settings**

4. Copy the GPO template files into your local system or AD. For example, to experiment with local group policy settings, add '**Firefox-CCK.admx**' into your "*%WINDIR%\PolicyDefinitions*" folder and copy '**Firefox-CCK.adml**' into this folder's '*en-us*' subfolder.

5. Create a new AD group policy or edit your local group policy (run **gpedit.msc**) with custom Firefox settings. The settings are found under *Computer Configuration | Administrative Templates | Mozilla | Firefox*.  Basic settings descriptions are provided.  For more details on specific settings, you'll need to run the CCK2 wizard and read the notes provided within the GUI.


cheers,

Scott
