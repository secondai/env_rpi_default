

# Second Raspberry Pi 3    

This is the Raspberry Pi host/launcher for the NodeJS version of the Second core. Basically a VM + Filesystem. 

The launcher/install requires some manual work (adding wifi credentials, sound cards setup, etc), that will be moved to the boot.sh/bootserver.py files. 

This should be easily releasable as a SD Card image (isn't yet). 


## Notes: 


### Flash SD Card 

This uses the Hypriot builder

```
flash -C flash-bootconfig.txt -u flash-user-data.yml https://github.com/hypriot/image-builder-rpi/releases/download/v1.9.0/hypriotos-rpi-v1.9.0.img.zip
```

On first boot, SD card downloads latest Second from https://github.com/secondai/env_rpi_default 

Runs automatically: 
```
curl -o- https://raw.githubusercontent.com/secondai/env_rpi_default/master/install.sh | bash
```


#### Audio 

Eventually could use `/etc/asound.conf` for default sound management (not working atm) 

Record (usb mic) & Play (usb speaker): 
```
arecord -D plughw:DEV=0,CARD=Device -f dat -d 3 test1.wav && aplay -D plughw:DEV=0,CARD=Device_1 test1.wav
```
