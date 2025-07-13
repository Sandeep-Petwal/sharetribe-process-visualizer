const DEFAULT_V3_EDN = `{:format :v3,
 :transitions
 [{:name :transition/inquire,
   :actor :actor.role/customer,
   :actions [{:name :action/update-protected-data}],
   :to :state/inquiry}
  {:name :transition/request-payment,
   :actor :actor.role/customer,
   :actions
   [{:name :action/update-protected-data}
    {:name :action/create-pending-booking, :config {:type :time}}
    {:name :action/privileged-set-line-items}
    {:name :action/stripe-create-payment-intent}],
   :to :state/pending-payment,
   :privileged? true}
  {:name :transition/request-payment,
   :actor :actor.role/customer,
   :actions
   [{:name :action/update-protected-data}
    {:name :action/create-pending-booking, :config {:type :time}}
    {:name :action/privileged-set-line-items}
    {:name :action/stripe-create-payment-intent}],
   :from :state/inquiry,
   :to :state/pending-payment,
   :privileged? true}
  {:name :transition/expire-payment,
   :at
   {:fn/plus
    [{:fn/timepoint [:time/first-entered-state :state/pending-payment]}
     {:fn/period ["PT15M"]}]},
   :actions
   [{:name :action/calculate-full-refund}
    {:name :action/stripe-refund-payment}
    {:name :action/decline-booking}],
   :from :state/pending-payment,
   :to :state/payment-expired}
  {:name :transition/confirm-payment,
   :actor :actor.role/customer,
   :actions [{:name :action/stripe-confirm-payment-intent}],
   :from :state/pending-payment,
   :to :state/preauthorized}
  {:name :transition/accept,
   :actor :actor.role/provider,
   :actions
   [{:name :action/accept-booking}
    {:name :action/stripe-capture-payment-intent}],
   :from :state/preauthorized,
   :to :state/accepted}
  {:name :transition/decline,
   :actor :actor.role/provider,
   :actions
   [{:name :action/calculate-full-refund}
    {:name :action/stripe-refund-payment}
    {:name :action/decline-booking}],
   :from :state/preauthorized,
   :to :state/declined}]}`

export default DEFAULT_V3_EDN;
