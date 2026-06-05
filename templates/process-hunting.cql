// ── Process Hunting Templates ──────────────────────────────────────────────

// [1] Top processes by host
#event_simpleName=ProcessRollup2
| groupBy([ComputerName, ImageFileName], function=count())
| sort(count, order=desc, limit=50)

// [2] Suspicious parent-child relationships
#event_simpleName=ProcessRollup2
ParentBaseFileName=explorer.exe
ImageFileName=/(?:cmd|powershell|wscript|cscript|mshta|regsvr32|rundll32)\.exe/i
| table([ComputerName, UserName, ImageFileName, CommandLine, ParentBaseFileName, @timestamp])

// [3] Encoded PowerShell detection
#event_simpleName=ProcessRollup2
ImageFileName=/powershell\.exe/i
CommandLine=/-[Ee]nc/
| table([ComputerName, UserName, CommandLine, @timestamp])
| sort(@timestamp, order=desc)

// [4] Living off the land binaries (LOLBins)
#event_simpleName=ProcessRollup2
| match(field=ImageFileName, array=[
  "certutil.exe", "bitsadmin.exe", "mshta.exe", "regsvr32.exe",
  "rundll32.exe", "wmic.exe", "cmstp.exe", "msiexec.exe",
  "installutil.exe", "msbuild.exe", "regasm.exe", "regsvcs.exe"
], ignoreCase=true)
| groupBy([ImageFileName, CommandLine], function=count())
| sort(count, order=desc)

// [5] Process timeline for a specific host
#event_simpleName=ProcessRollup2
ComputerName="HOSTNAME"
| timeChart(span=15m, function=count())
