#!/bin/sh

if [ -x "/bin/opkg" ]; then
	opkg remove luci-app-mihomo
	opkg remove mihomo
elif [ -x "/usr/bin/apk" ]; then
	apk del luci-app-mihomo
	apk del mihomo
fi

rm -rf /etc/mihomo
rm -f /etc/config/mihomo
