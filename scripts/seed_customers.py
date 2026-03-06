#!/usr/bin/env python3
import mysql.connector, re

db_url = "mysql://paZkiNgy2nHQcsT.root:mB5jFs2uVaZjEegW@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test"
m = re.match(r"mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", db_url)
user, password, host, port, database = m.groups()

conn = mysql.connector.connect(
    host=host, port=int(port), user=user, password=password,
    database=database, tls_versions=["TLSv1.2", "TLSv1.3"]
)
cursor = conn.cursor()

customers = [
    # 海外客户
    {
        "code": "KH-00003",
        "name": "Medline Industries, Inc.",
        "shortName": "Medline",
        "type": "overseas",
        "contactPerson": "James Carter",
        "phone": "+1-847-949-5500",
        "email": "james.carter@medline.com",
        "country": "美国",
        "address": "Three Lakes Drive, Northfield, IL 60093, USA",
        "paymentTerms": "月结60天",
        "currency": "USD",
        "creditLimit": "500000.00",
        "needInvoice": 0,
        "status": "active",
        "source": "展会",
        "createdBy": 1,
    },
    # 经销商
    {
        "code": "KH-00004",
        "name": "苏州康华医疗器械经销有限公司",
        "shortName": "康华医疗",
        "type": "dealer",
        "contactPerson": "王建国",
        "phone": "13912345678",
        "email": "wangjg@kanghua-med.com",
        "province": "江苏省",
        "city": "苏州市",
        "address": "苏州工业园区星湖街328号生物纳米园B2栋501室",
        "paymentTerms": "月结30天",
        "currency": "CNY",
        "creditLimit": "200000.00",
        "taxNo": "91320594MA1XXXXX01",
        "bankName": "中国工商银行苏州分行",
        "bankAccount": "1234567890123456789",
        "needInvoice": 1,
        "status": "active",
        "source": "渠道推荐",
        "createdBy": 1,
    },
]

for c in customers:
    cols = ", ".join(f"`{k}`" for k in c.keys())
    placeholders = ", ".join(["%s"] * len(c))
    sql = f"INSERT INTO customers ({cols}) VALUES ({placeholders})"
    cursor.execute(sql, list(c.values()))
    print(f"✅ 已创建客户：{c['name']}")

conn.commit()
cursor.close()
conn.close()
print("完成！")
