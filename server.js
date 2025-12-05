const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/scan-self", (req, res) => {
    const { fullName, reason } = req.body;

    if (!fullName || !reason) {
        return res.status(400).json({ error: "Missing fields" });
    }

    exec("ipconfig /all", (error, stdout) => {
        if (error) {
            return res.status(500).json({ error: "Unable to run ipconfig" });
        }

        const ipv4 = stdout.match(/IPv4 Address.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const gateway = stdout.match(/Default Gateway.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const dnsServers = [...stdout.matchAll(/DNS Servers.*?:\s*([^\r\n]+)/g)].map(m => m[1]);
        const mac = stdout.match(/Physical Address.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const dhcpEnabled = stdout.match(/DHCP Enabled.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const subnet = stdout.match(/Subnet Mask.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const adapter = stdout.match(/adapter ([^:]+):/)?.[1] || "Unknown";
        const dnsSuffix = stdout.match(/DNS Suffix.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const dhcpServer = stdout.match(/DHCP Server.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const leaseObtained = stdout.match(/Lease Obtained.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";
        const leaseExpires = stdout.match(/Lease Expires.*?:\s*([^\r\n]+)/)?.[1] || "Unknown";

        const hostname = os.hostname();
        const osPlatform = os.platform();
        const networkInterfaces = os.networkInterfaces();

        exec("arp -a", (arpErr, arpOut) => {
            const arpTable = arpErr ? "Unavailable" : arpOut;

            exec("netstat -ano", (netErr, netOut) => {
                const openPorts = netErr ? "Unavailable" : netOut;

                const result = {
                    fullName,
                    reason,
                    timestamp: new Date().toISOString(),
                    deviceInfo: {
                        hostname,
                        osPlatform,
                        adapter
                    },
                    ipconfig: {
                        ipv4,
                        gateway,
                        subnet,
                        dnsSuffix,
                        dnsServers,
                        mac,
                        dhcpEnabled,
                        dhcpServer,
                        leaseObtained,
                        leaseExpires
                    },
                    networkInterfaces,
                    arpTable,
                    openPorts
                };

                let logs = [];
                if (fs.existsSync("logs.json")) {
                    logs = JSON.parse(fs.readFileSync("logs.json", "utf8"));
                }
                logs.push(result);
                fs.writeFileSync("logs.json", JSON.stringify(logs, null, 4));

                res.json({ message: "Local network info retrieved", data: result });
            });
        });
    });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
