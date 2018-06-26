

# Dockerized for RPI 


### Flash SD Card 
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


### OLD 

https://blog.hypriot.com/getting-started-with-docker-and-mac-on-the-raspberry-pi/ 
```
diskutil unmountdisk /dev/disk4
sudo dd if=/Users/nickreed/Downloads/hypriotos-rpi-v1.7.1.img of=/dev/rdisk4 bs=1m
```

	

```
docker build -t nickreed/rpi-second .
```


Run docker image/container with valid environment variable values 

	COMPOSE_PROJECT_NAME=second2 MONGODB=testseconddb44472 PORT_ON=7003 docker-compose up --build



### This is nearly the same instance as for second_env_cloud 

