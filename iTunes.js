/*
***********************************************
项目名称：iTunes-系列解锁合集 (深度优化版)
更新日期：2026-07-07
脚本作者：@xiangjiaoxun
使用声明：⚠️仅供参考，禁转载与售卖！
优化内容：补全了 status、pending_renewal_info 和 pst 时间戳，大幅提升解锁成功率。
***********************************************

[rewrite_local]
^https?:\/\/((sandbox|buy)\.itunes\.apple\.com)\/verifyReceipt$ url script-response-body https://raw.githubusercontent.com/xiangjiaoxun/goumai/main/iTunes.js

[mitm]
hostname = buy.itunes.apple.com, sandbox.itunes.apple.com
***********************************************/

(function () {
    let body = $response.body;
    
    function tryParse(raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    let obj = tryParse(body);

    if (obj) {
        // 🔥 【最关键优化】必须明确指定 status 为 0，否则 App 会直接无视下方的权益数据
        obj.status = 0;
        
        // 初始化并补全苹果标准收据骨架
        if (!obj.receipt) obj.receipt = {};
        if (!obj.latest_receipt_info) obj.latest_receipt_info = [];
        if (!obj.pending_renewal_info) obj.pending_renewal_info = [];
        
        obj.environment = "Production"; 
        obj.receipt.receipt_type = "Production";
        
        // 核心 Mock 订阅商品数据
        // 💡 提示：如果依然无效，请抓包确认目标 App 的内购 ID，替换下方的 com.premium.yearly
        let productId = "com.premium.yearly"; 
        let transactionId = "490001234567890";

        let mockReceipt = {
            "quantity": "1",
            "product_id": productId, 
            "transaction_id": transactionId,
            "original_transaction_id": transactionId,
            "purchase_date": "2026-07-01 00:00:00 Etc/GMT",
            "purchase_date_ms": "1782854400000",
            "purchase_date_pst": "2026-06-30 17:00:00 America/Los_Angeles",
            "original_purchase_date": "2026-07-01 00:00:00 Etc/GMT",
            "original_purchase_date_ms": "1782854400000",
            "original_purchase_date_pst": "2026-06-30 17:00:00 America/Los_Angeles",
            "expires_date": "2099-12-31 23:59:59 Etc/GMT", 
            "expires_date_ms": "4102444799000",
            "expires_date_pst": "2099-12-31 15:59:59 America/Los_Angeles",
            "web_order_line_item_id": "490000000000001",
            "is_trial_period": "false",
            "is_in_intro_offer_period": "false"
        };

        // 🔥 【优化二】补全订阅自动续期状态，很多现代 SDK 会严格校验此数组
        let mockRenewal = {
            "expiration_intent": "0",
            "auto_renew_status": "1",
            "is_in_billing_retry_period": "0",
            "product_id": productId,
            "original_transaction_id": transactionId,
            "auto_renew_product_id": productId
        };

        // 注入修改后的数据
        obj.latest_receipt_info.push(mockReceipt);
        obj.pending_renewal_info.push(mockRenewal);
        
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
