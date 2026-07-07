/*
***********************************************
项目名称：iTunes-本地通用内购破解 (大老同款矩阵架构)
更新日期：2026-07-07
脚本作者：@xiangjiaoxun
使用声明：⚠️仅供参考，禁转载与售卖！
解密原理：已有历史收据全量延期 + 新账号多重商品ID矩阵伪造
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
        // 1. 强改状态码为 0（代表苹果服务器验证成功）
        obj.status = 0;
        obj.environment = "Production"; 
        obj.receipt.receipt_type = "Production";
        
        let bundleId = obj.receipt.bundle_id;

        // 2. 【核心逻辑一】如果用户有任何过期的历史购买记录，直接全量劫持并延期到 2099
        if (obj.latest_receipt_info && obj.latest_receipt_info.length > 0) {
            obj.latest_receipt_info.forEach(item => {
                item.expires_date = "2099-12-31 23:59:59 Etc/GMT";
                item.expires_date_ms = "4102444799000";
                item.expires_date_pst = "2099-12-31 15:59:59 America/Los_Angeles";
            });
        }
        
        if (obj.receipt.in_app && obj.receipt.in_app.length > 0) {
            obj.receipt.in_app.forEach(item => {
                item.expires_date = "2099-12-31 23:59:59 Etc/GMT";
                item.expires_date_ms = "4102444799000";
                item.expires_date_pst = "2099-12-31 15:59:59 America/Los_Angeles";
            });
        }

        if (obj.pending_renewal_info && obj.pending_renewal_info.length > 0) {
            obj.pending_renewal_info.forEach(item => {
                item.auto_renew_status = "1";
                item.expiration_intent = "0";
            });
        }

        // 3. 【核心逻辑二】如果收据完全为空（全新账号），则动态构建“内购商品ID矩阵”下发
        if (!obj.latest_receipt_info || obj.latest_receipt_info.length === 0) {
            obj.latest_receipt_info = [];
            obj.receipt.in_app = [];
            obj.pending_renewal_info = [];

            // 自动组合出 6 种以上最普遍的内购 ID 命名规范
            let productIds = [
                bundleId + ".vip",
                bundleId + ".pro",
                bundleId + ".premium",
                bundleId + ".yearly",
                "pro_yearly",
                "vip_yearly"
            ];

            // 针对特定知名 App 进行内购 ID 补充适配（例如 TimeCut）
            if (bundleId.includes("timecut")) {
                productIds.push("com.vlognow.timecut.pro_yearly");
                productIds.push("timecut.pro.yearly");
            }

            // 批量生成并注入矩阵数据
            productIds.forEach((pid, index) => {
                let tid = "49000" + (1234567890 + index);
                let mockReceipt = {
                    "quantity": "1",
                    "product_id": pid,
                    "transaction_id": tid,
                    "original_transaction_id": tid,
                    "purchase_date": "2026-07-01 00:00:00 Etc/GMT",
                    "purchase_date_ms": "1782854400000",
                    "purchase_date_pst": "2026-06-30 17:00:00 America/Los_Angeles",
                    "original_purchase_date": "2026-07-01 00:00:00 Etc/GMT",
                    "original_purchase_date_ms": "1782854400000",
                    "original_purchase_date_pst": "2026-06-30 17:00:00 America/Los_Angeles",
                    "expires_date": "2099-12-31 23:59:59 Etc/GMT",
                    "expires_date_ms": "4102444799000",
                    "expires_date_pst": "2099-12-31 15:59:59 America/Los_Angeles",
                    "web_order_line_item_id": "49000000000000" + index,
                    "is_trial_period": "false",
                    "is_in_intro_offer_period": "false"
                };

                let mockRenewal = {
                    "expiration_intent": "0",
                    "auto_renew_status": "1",
                    "is_in_billing_retry_period": "0",
                    "product_id": pid,
                    "original_transaction_id": tid,
                    "auto_renew_product_id": pid
                };

                obj.latest_receipt_info.push(mockReceipt);
                obj.receipt.in_app.push(mockReceipt);
                obj.pending_renewal_info.push(mockRenewal);
            });
        }

        $done({ body: JSON.stringify(obj) });
    } else {
        $done({});
    }
})();
