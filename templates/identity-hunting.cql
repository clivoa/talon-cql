// ── Identity & Credential Hunting Templates ───────────────────────────────

// [1] Failed logon spike — potential brute force
#event_simpleName=UserLogonFailed2
| groupBy([ComputerName, UserName], function=count())
| filter(count > 10)
| sort(count, order=desc)

// [2] Logon outside business hours (UTC — adjust offset as needed)
#event_simpleName=UserLogon
| eval(hour := time:hour(@timestamp))
| filter(hour < 7 OR hour > 20)
| table([ComputerName, UserName, LogonType, hour, @timestamp])
| sort(@timestamp, order=desc)

// [3] Admin logons — lateral movement indicator
#event_simpleName=UserLogon
UserIsAdmin=1
| groupBy([ComputerName, UserName], function=count())
| sort(count, order=desc)

// [4] Unique hosts per user — unusual access pattern
#event_simpleName=UserLogon
| groupBy([UserName], function=count(field=ComputerName, distinct=true, as=unique_hosts))
| filter(unique_hosts > 5)
| sort(unique_hosts, order=desc)

// [5] Credential access — LSASS reads
#event_simpleName=ProcessRollup2
| join(
    {#event_simpleName=ProcessAccess
     TargetImageFileName=/lsass\.exe/i},
    field=[ContextProcessId]
  )
| table([ComputerName, UserName, ImageFileName, TargetImageFileName, @timestamp])
