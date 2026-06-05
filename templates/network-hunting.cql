// ── Network Hunting Templates ──────────────────────────────────────────────

// [1] Top external destinations
#event_simpleName=NetworkConnectIP4
| cidr("10.0.0.0/8", field=RemoteAddressIP4, negate=true)
| cidr("172.16.0.0/12", field=RemoteAddressIP4, negate=true)
| cidr("192.168.0.0/16", field=RemoteAddressIP4, negate=true)
| groupBy([RemoteAddressIP4, RemotePort], function=count())
| sort(count, order=desc, limit=50)

// [2] Beaconing detection — regular intervals to same destination
#event_simpleName=NetworkConnectIP4
| groupBy([ComputerName, RemoteAddressIP4, RemotePort], function=[
    count(),
    min(@timestamp, as=first_seen),
    max(@timestamp, as=last_seen)
  ])
| eval(duration_min := (last_seen - first_seen) / 60000)
| filter(count > 10 AND duration_min > 30)
| sort(count, order=desc)

// [3] Connections on suspicious ports
#event_simpleName=NetworkConnectIP4
| filter(RemotePort in [4444, 1337, 31337, 8080, 8443, 9090, 6667, 6666])
| groupBy([ComputerName, RemoteAddressIP4, RemotePort], function=count())
| ipLocation(field=RemoteAddressIP4)
| table([ComputerName, RemoteAddressIP4, RemotePort, RemoteAddressIP4.country, count])

// [4] Outbound connections by process
#event_simpleName=NetworkConnectIP4
| join(
    {#event_simpleName=ProcessRollup2},
    field=[ContextProcessId]
  )
| groupBy([ImageFileName, RemoteAddressIP4, RemotePort], function=count())
| sort(count, order=desc)

// [5] Geolocation anomaly — connections to unusual countries
#event_simpleName=NetworkConnectIP4
| ipLocation(field=RemoteAddressIP4)
| filter(RemoteAddressIP4.country != "United States")
| groupBy([RemoteAddressIP4.country, RemoteAddressIP4, RemotePort], function=count())
| sort(count, order=desc)
