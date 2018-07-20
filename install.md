
## 关于
了解k8s [kubernets整体结构](https://www.kubernetes.org.cn/4047.html)
## 离线包地址
使用前注意个版本的依赖
搜索关键词查看：External Dependencies
```
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.11.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.10.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.9.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.8.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.6.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.5.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.4.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.3.md
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.2.md

```
## 部署实例
以1.10为例
```
https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.10.md

```
百度网盘地址：
```
链接：https://pan.baidu.com/s/1IBY8IyCdbVR8vEXGlDgZnw 密码：om22

```
初始化：
```
cat>>/etc/sysctl.conf<<EOF
net.ipv4.conf.all.rp_filter = 1
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl -p
swapoff -a
setenforce 0
hostnamectl set-hostname 'master'
echo "192.168.1.234 master" >> /etc/hosts
python -c "import socket; print socket.getfqdn(); print socket.gethostbyname(socket.getfqdn())"
```
mkdir -p /opt/ && cd /opt/
yum install -y yum-utils device-mapper-persistent-data lvm2 epel-release pigz socat screen
cp client/bin/kubectl /usr/bin/
先需要装docker etcd 服务
```
{
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum makecache fast
yum -y install docker-ce-selinux-17.03.0.ce-1.el7.centos docker-ce-17.03.0.ce
curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://a004e50b.m.daocloud.io
service docker start
}
[root@localhost server]# grep -v '^#' /etc/etcd/etcd.conf 
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_CLIENT_URLS="http://localhost:2379,http://192.168.1.234:2379"
ETCD_NAME="default"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.1.234:2379"


yum -y install etcd&& service etcd start 
 systemctl enable etcd docker
```

### master:
```
cd kubernetes/server
yum -y install screen
vi kube-apiserver.sh 
bin/kube-apiserver --cert-dir=etc/kubernetes/cert --insecure-bind-address=0.0.0.0 --insecure-port=8080 --service-cluster-ip-range=10.0.0.0/16 --etcd-servers=http://192.168.1.234:2379 --logtostderr=true  --allow-privileged=true --anonymous-auth=true

vi kube-controller-manager.sh
bin/kube-controller-manager --master=192.168.1.234:8080 --service-account-private-key-file=etc/kubernetes/cert/apiserver.key --root-ca-file=etc/kubernetes/cert/apiserver.crt --logtostderr=true

vi kube-scheduler.sh
bin/kube-scheduler --master=192.168.1.234:8080

```

### 检测【适用node节点】
```
bin/kubectl -s 192.168.1.234:8080 get ep -n kube-system
bin/kubectl -s 192.168.1.234:8080 get cs
bin/kubectl -s 192.168.1.234:8080 get all -o wide --all-namespaces
kubectl get nodes
kubectl get events
```




### node:
注意:
192.168.1.234:8080 这个地址一直是kube-apiserver的地址
这里node和master都能签发证书

```
cd kubernetes/node
mkdir -p etc/kubernetes/cert
KUBE_APISERVER="http://192.168.1.234:8080"
bin/kubectl config set-cluster kubernetes --server=$KUBE_APISERVER --kubeconfig=etc/kubernetes/kubelet.kubeconfig
bin/kubectl config set-context default --cluster=kubernetes --user=default-noauth --kubeconfig=etc/kubernetes/kubelet.kubeconfig
bin/kubectl config use-context default --kubeconfig=etc/kubernetes/kubelet.kubeconfig
bin/kubectl config view --kubeconfig=etc/kubernetes/kubelet.kubeconfig

cat >etc/kubernetes/kubelet.config.yaml<<EOF
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: cgroupfs
EOF
需要拉取容器
docker pull registry.access.redhat.com/rhel7/pod-infrastructure:latest

vi kubelet.sh
bin/kubelet --cert-dir=etc/kubernetes/cert --kubeconfig=etc/kubernetes/kubelet.kubeconfig --config=etc/kubernetes/kubelet.config.yaml --pod-infra-container-image=registry.access.redhat.com/rhel7/pod-infrastructure:latest --runtime-cgroups=/systemd/system.slice --kubelet-cgroups=/systemd/system.slice --logtostderr=true --fail-swap-on=false  --allow_privileged=true  --cluster_domain=cluster.local --cluster_dns=10.0.244.1  --anonymous-auth=true


vi kube-proxy.sh
bin/kube-proxy --master=192.168.1.234:8080 --proxy-mode=iptables --logtostderr=true

```
启动k8s基础服务
vi start-master.sh
```
cd /opt/kubernetes/server
screen -dmS kube-apiserver bash kube-apiserver.sh
etcdctl --endpoints http://192.168.1.234:2379 set /flannel/network/config '{"Network":"10.0.0.0/16","SubnetLen":24,"Backend":{"Type":"vxlan","VNI":0}}'
screen -dmS kube-controller-manager bash kube-controller-manager.sh
screen -dmS kube-scheduler bash kube-scheduler.sh
```
vi start-node.sh
```
etcdctl --endpoints http://192.168.1.234:2379 set /flannel/network/config '{"Network":"10.0.0.0/16","SubnetLen":24,"Backend":{"Type":"vxlan","VNI":0}}'
cd /opt/kubernetes/node
screen -dmS kubelet bash kubelet.sh
screen -dmS kube-proxy bash kube-proxy.sh

```
## 部署测试

```
bin/kubectl -s 192.168.1.234:8080 run linux --image=jingslunt/linux --port=5701

```
使用yml测试
```
https://hub.docker.com/r/jingslunt/linux/
kubectl create -f /root/linux.yml
```

### 故障排查
```
kubectl logs --namespace=kube-system $(kubectl get pods --namespace=kube-system -l k8s-app=kube-dns -o name) -c kubedns
docker ps -a |grep kube-dns|awk '{print $1}'|head -n 4|xargs -i docker logs {}
docker ps -a
docker logs eb2e95257b8f
```

## 网络部署 flannld或者calico,kube-dns,ingress

### etcd:
```
https://github.com/coreos/etcd/releases
```
### flannld:
```

安装flannel和ectdctl
创建变量
etcdctl --endpoints http://192.168.1.234:2379 set /flannel/network/config '{"Network":"10.0.0.0/16","SubnetLen":24,"Backend":{"Type":"vxlan","VNI":0}}'
etcdctl get /flannel/network/config
查看全部 etcdctl get / --prefix --keys-only

yum -y install flannel
mkdir -p /var/log/k8s/flannel/
修改配置文件flanneld
[root@localhost ~]# grep -v '^#' /etc/sysconfig/flanneld|grep -v ^$
FLANNEL_ETCD_ENDPOINTS="http://192.168.1.234:2379"
FLANNEL_ETCD_PREFIX="/flannel/network"
FLANNEL_OPTIONS="--logtostderr=false --log_dir=/var/log/k8s/flannel/ --iface=eth0"
```
查看docker启动参数是否加入falnnel变量
```
/usr/lib/systemd/system/docker.service.d/flannel.conf
[root@localhost addons]# cat /run/flannel/docker
DOCKER_OPT_BIP="--bip=10.0.76.1/24"
DOCKER_OPT_IPMASQ="--ip-masq=true"
DOCKER_OPT_MTU="--mtu=1450"
DOCKER_NETWORK_OPTIONS=" --bip=10.0.76.1/24 --ip-masq=true --mtu=1450"
[root@localhost addons]# cat /run/flannel/subnet.env
FLANNEL_NETWORK=10.0.0.0/16
FLANNEL_SUBNET=10.0.76.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=false
```

配置docker
```
systemctl edit docker
[Service]
ExecStart=
ExecStart=/usr/bin/docker daemon -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock $DOCKER_NETWORK_OPTIONS

systemctl daemon-reload&&systemctl restart docker
```

### calico【未完成】:
```
wget 'https://github.com/projectcalico/calico/releases/download/v2.6.7/release-v2.6.7.tgz'
tar -zxvf release-v2.6.7.tgz && cd release-v2.6.7
for i in `ls images/`;do docker load < images/$i;done

docker images|grep calico|awk '{print "docker tag "$3" quay.io/"$1":"$2}'

cat calico.yaml|grep 2379 【修改etcd服务地址】
etcd_endpoints: "http://192.168.1.234:2379"
kubectl -s 192.168.1.234:8080 create -f k8s-manifests/hosted/calico.yaml

```

### kube-dns：
```
vi kube-dns.yml
clusterIP: 10.0.244.1 ## 这个ip需要与kubelet指定的一致，kubelet上指定为
--cluster_dns=10.0.244.1
--cluster_domain=cluster.local
kube-master-url ## 这个ip为api服务器的ip
```
设置支持外部dns
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
data:
  stubDomains: |
    {"baidu.com": ["114.114.114.114"]}
  upstreamNameservers: |
    ["114.114.114.114", "8.8.4.4"]
```


















