/*
***********************************************
项目名称：iTunes-系列解锁合集
更新日期：2026-07-07
脚本作者：@xiangjiaoxun
电报频道：https://t.me/xiangjiaoxun
使用声明：⚠️仅供参考，禁转载与售卖！
使用说明：如果脚本无效，请先排除是否脚本冲突。
特别说明：此脚本可能会导致App Store无法登录ID。
解决方法：关[MITM][脚本][代理工具]方法选一即可。
***********************************************

[rewrite_local]
^https?:\/\/((sandbox|buy)\.itunes\.apple\.com)\/verifyReceipt$ url script-response-body https://raw.githubusercontent.com/xiangjiaoxun/goumai/main/iTunes.js

[mitm]
hostname = buy.itunes.apple.com, sandbox.itunes.apple.com
***********************************************/

(function () {
    let body = $response.body;
    let ddm = null, data = null, anchor = false;
    
    function tryParse(raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    let obj = tryParse(body);

    if (obj) {
        if (!obj.receipt) obj.receipt = {};
        if (!obj.latest_receipt_info) obj.latest_receipt_info = [];
        
        obj.environment = "Production"; 
        
        // 核心 Mock 订阅数据
        let mockReceipt = {
            "quantity": "1",
            "product_id": "com.example.app.premium_yearly", 
            "transaction_id": "490001234567890",
            "original_transaction_id": "490001234567890",
            "purchase_date": "2026-07-01 00:00:00 Etc/GMT",
            "purchase_date_ms": "1782854400000",
            "original_purchase_date": "2026-07-01 00:00:00 Etc/GMT",
            "original_purchase_date_ms": "1782854400000",
            "expires_date": "2099-12-31 23:59:59 Etc/GMT", 
            "expires_date_ms": "4102444799000",
            "web_order_line_item_id": "490000000000001",
            "is_trial_period": "false",
            "is_in_intro_offer_period": "false"
        };

        obj.latest_receipt_info.push(mockReceipt);
        
        if (obj.receipt.in_app) {
            obj.receipt.in_app.push(mockReceipt);
        } else {
            obj.receipt.in_app = [mockReceipt];
        }

        $done({ body: JSON.stringify(obj) });
    } else {
        $done({});
    }
})();
