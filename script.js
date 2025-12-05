async function runScan() {
    const fullName = document.getElementById("fullName").value.trim();
    const reason = document.getElementById("reason").value.trim();

    const statusBox = document.getElementById("status");
    const resultsBox = document.getElementById("results");

    resultsBox.innerHTML = "";

    if (!fullName) {
        statusBox.textContent = "Full name is required.";
        return;
    }
    if (!reason) {
        statusBox.textContent = "Reason is required.";
        return;
    }

    statusBox.textContent = "Gathering local network information...";

    try {
        const response = await fetch("http://localhost:3000/scan-self", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, reason })
        });

        if (!response.ok) throw new Error("Scan failed with status: " + response.status);

        const result = await response.json();
        const info = result.data;

        statusBox.textContent = "Scan complete";

        const fields = [
            { label: "Hostname", value: info.deviceInfo.hostname },
            { label: "Operating System", value: info.deviceInfo.osPlatform },
            { label: "IPv4 Address", value: info.ipconfig.ipv4 },
            { label: "Default Gateway", value: info.ipconfig.gateway },
            { label: "Subnet Mask", value: info.ipconfig.subnet },
            { label: "DNS Suffix", value: info.ipconfig.dnsSuffix },
            { label: "DNS Servers", value: info.ipconfig.dnsServers.join(", ") },
            { label: "MAC Address", value: info.ipconfig.mac },
            { label: "DHCP Enabled", value: info.ipconfig.dhcpEnabled },
            { label: "DHCP Server", value: info.ipconfig.dhcpServer },
            { label: "DHCP Lease Obtained", value: info.ipconfig.leaseObtained },
            { label: "DHCP Lease Expires", value: info.ipconfig.leaseExpires }
        ];

        fields.forEach(field => {
            const p = document.createElement("p");
            p.textContent = field.label + ": " + field.value;
            resultsBox.appendChild(p);
        });

        const arpTitle = document.createElement("h4");
        arpTitle.textContent = "ARP Table";
        resultsBox.appendChild(arpTitle);

        const arpPre = document.createElement("pre");
        arpPre.textContent = info.arpTable;
        resultsBox.appendChild(arpPre);

        const portsTitle = document.createElement("h4");
        portsTitle.textContent = "Open Ports";
        resultsBox.appendChild(portsTitle);

        const portsPre = document.createElement("pre");
        portsPre.textContent = info.openPorts;
        resultsBox.appendChild(portsPre);

        const interfacesTitle = document.createElement("h4");
        interfacesTitle.textContent = "Network Interfaces";
        resultsBox.appendChild(interfacesTitle);

        const interfacesPre = document.createElement("pre");
        interfacesPre.textContent = JSON.stringify(info.networkInterfaces, null, 4);
        resultsBox.appendChild(interfacesPre);

    } catch (err) {
        statusBox.textContent = "Error running scanner.";
    }
}

document.getElementById("scanBtn").addEventListener("click", runScan);
