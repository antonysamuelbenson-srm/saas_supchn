ROUTE_ROLE_MAP = {
    # --- Admin Only ---
    "GET:/admin/users":                        ["admin"],
    "PUT:/user/<role_user_id>/role":    ["admin"],
    "DELETE:/user/<role_user_id>":      ["admin"],
    "POST:/user/<role_user_id>/deactivate": ["admin"],

    # --- Auth (public) ---
    "POST:/register":                   ["public"],
    "POST:/login":                     ["public"],

    # --- Alerts ---
    "GET:/alerts":                     ["admin", "editor", "viewer"],
    "POST:/alerts/refresh":            ["admin", "editor", "viewer"],
    "POST:/alerts/check-stockout-after-reorder": ["admin", "editor"],

    # --- Config ---
    "POST:/config/recalculate-thresholds": ["admin", "editor"],
    "GET:/config/formulas":                ["admin", "editor"],
    "POST:/config/apply-formula":          ["admin", "editor"],
    "POST:/config/update-lead-times":      ["admin", "editor"],
    "POST:/config/set-lookahead-days":     ["admin", "editor", "viewer"],

    # --- Dashboard ---
    "GET:/dashboard":                   ["admin", "editor", "viewer"],
    "POST:/dashboard/recompute":      ["admin", "editor", "viewer"],

    # --- Forecast ---
    "GET:/forecast/store/<int:store_id>":  ["admin", "editor", "viewer"],
    "GET:/user/lookahead_days":              ["admin", "editor", "viewer"],
    "POST:/user/lookahead_days":             ["admin", "editor", "viewer"],

    # --- Store ---
    "POST:/store_upload":               ["admin", "editor"],
    "GET:/stores":                     ["admin", "editor", "viewer"],
    "GET:/store/<int:store_id>/summary":           ["admin", "editor", "viewer"],
    "GET:/store/<int:store_id>/hover":             ["admin", "editor", "viewer"],
    "GET:/stores/with-alert-status":               ["admin", "editor", "viewer"],
    "GET:/store/<int:store_id>/with-alert-status": ["admin", "editor", "viewer"],

    # --- Node Location Update ---
    "POST:/update_store":               ["admin", "editor"],

    # --- Reorder ---
    "GET:/reorder/generate": ["admin", "editor", "viewer"],   # View reorder suggestions (centralized for all)
    "POST:/reorder/place":      ["admin", "editor"],

    # ----Availability rate----
    "GET:/availability": ["admin", "editor","viewer"],
    "POST:/availability/recompute" : ["admin", "editor"],


    # --- Uploads ---
    "POST:/api/upload/store":                ["admin", "editor", "viewer"],
    "POST:/api/upload/inventory":            ["admin", "editor", "viewer"],
    "POST:/api/upload/forecast":             ["admin", "editor", "viewer"],
    "POST:/api/upload/totalStoreData":       ["admin", "editor", "viewer"],
    "POST:/api/upload/transferCostData":     ["admin", "editor", "viewer"],
    "POST:/api/upload/warehouseMaxData":     ["admin", "editor", "viewer"],

    "GET:/user/permissions": ["admin", "editor", "viewer"],

    # --- Compare Forecasts ---
    "GET:/compare":                          ["admin", "editor", "viewer"],

}
