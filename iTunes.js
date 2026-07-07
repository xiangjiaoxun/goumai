/*
***********************************************
项目名称：iTunes-本地内购通用解锁 (精简复刻版)
更新日期：2026-07-07
脚本作者：@xiangjiaoxun
使用声明：⚠️仅供参考，禁转载与售卖！
解密原理：动态识别 Bundle ID，全量劫持最新收据和续费序列
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

    if (obj && obj.receipt) {
        // 1. 强制注入苹果服务器验证成功状态
        obj.status = 0;
        
        // 2. 动态捕获当前 App 的真实包名
        let bundleId = obj.receipt.bundle_id;
        
        // 3. 智能构建内购商品 ID 匹配机制 (参照大老常见配置)
        let productId = bundleId + ".vip"; 
        if (bundleId.includes("timecut")) {
            productId = "com.vlognow.timecut.pro_yearly"; // 精准适配 TimeCut 
        } else if (bundleId.includes("gbox")) {
            productId = "com.gbox.pro_yearly";
        }

        let transactionId = "490001234567890";

        // 4. 构造标准的永久订阅数据骨架
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

        let mockRenewal = {
            "expiration_intent": "0",
            "auto_renew_status": "1",
            "is_in_billing_retry_period": "0",
            "product_id": productId,
            "original_transaction_id": transactionId,
            "auto_renew_product_id": productId
        };

        // 5. 【核心逻辑优化】遍历并改写应用现有的全部历史收据，实现全自动内购同步
        if (obj.latest_receipt_info && obj.latest_receipt_info.length > 0) {
            obj.latest_receipt_info.forEach(item => {
                item.expires_date = "2099-12-31 23:59:59 Etc/GMT";
                item.expires_date_ms = "4102444799000";
                item.expires_date_pst = "2099-12-31 15:59:59 America/Los_Angeles";
            });
        } else {
            obj.latest_receipt_info = [mockReceipt];
        }

        if (obj.receipt.in_app && obj.receipt.in_app.length > 0) {
            obj.receipt.in_app.forEach(item => {
                item.expires_date = "2099-12-31 23:59:59 Etc/GMT";
                item.expires_date_ms = "4102444799000";
                item.expires_date_pst = "2099-12-31 15:59:59 America/Los_Angeles";
            });
        } else {
            obj.receipt.in_app = [mockReceipt];
        }

        if (obj.pending_renewal_info && obj.pending_renewal_info.length > 0) {
            obj.pending_renewal_info.forEach(item => {
                item.auto_renew_status = "1";
                item.expiration_intent = "0";
            });
        } else {
            obj.pending_renewal_info = [mockRenewal];
        }

        $done({ body: JSON.stringify(obj) });
    } else {
        $done({});
    }
})();
