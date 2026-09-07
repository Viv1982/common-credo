window.CC_STORY = [
  {
    "id": "step-0",
    "title": "Onboard an issuer",
    "paragraphs": [
      "Riverside Traders Co-operative is going to start vouching for its members. It generates a signing key: a private half it never shares, and a public half that will travel inside every record it seals.",
      "It also publishes its first cancellation noticeboard — empty, but signed — so a verifier always finds a genuine noticeboard to check, even one with nothing on it yet."
    ],
    "gapCallout": {
      "label": "Gap 1",
      "text": "Nothing in the Spec says how a verifier who has never heard of Riverside Traders first learns that this is really its key and noticeboard. The Spec has the record self-declare both, which proves internal consistency, not identity. This demo stands in with a small shared directory — not a Common Credo component, just a placeholder for whatever real trust root CC eventually picks."
    },
    "card": {
      "type": "keyvalue",
      "title": "Issuer",
      "rows": [
        [
          "Name",
          "Riverside Traders Co-operative"
        ],
        [
          "Type",
          "Cooperative"
        ],
        [
          "Location",
          "Nairobi, Kenya"
        ],
        [
          "Public key (truncated)",
          "d177970d25c2c962…"
        ]
      ]
    }
  },
  {
    "id": "step-1",
    "title": "Create and seal a record",
    "paragraphs": [
      "Amina Yusuf, a trader, has honoured two years of trade credit with the co-op. The co-op vouches for her — it saw the money move, and it has real stake in being right.",
      "Every mandatory field the Spec requires is present. Before sealing, the record is given a Record ID: the fingerprint of everything in it, computed by hashing the record’s own content.",
      "The co-op signs it. Change one character now — the amount, the date, anything — and the seal breaks."
    ],
    "gapCallout": {
      "label": "Gap 2",
      "text": "The Spec’s own mandatory-fields list never actually defines a Record ID, even though the cancellation mechanism depends on one to know which record an entry refers to. This toolkit fills that hole: the ID is a hash of the record’s content, computed before sealing, so it is tamper-evident by the same logic as the seal itself."
    },
    "card": {
      "type": "record",
      "data": {
        "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
        "issuer": {
          "name": "Riverside Traders Co-operative",
          "orgType": "cooperative",
          "location": "Nairobi, Kenya",
          "publicKey": "d177970d25c2c962adc3574d051e3eb56386f8299732032be354deb01957c931"
        },
        "subject": {
          "reference": "Amina Yusuf",
          "identityAnchorType": "phone_number",
          "identityAnchorValue": "+254-7XX-XXX-001"
        },
        "claim": {
          "claimType": "trade_credit_honoured",
          "isRegionalExtension": false,
          "amount": 1200,
          "period": "2024-01 to 2026-01",
          "outcome": {
            "polarity": "positive",
            "detail": "all trade credit repaid on agreed terms"
          }
        },
        "vouchType": "saw_money_move",
        "stake": {
          "type": "financial",
          "description": "co-op forfeits a bonding deposit if this vouch is proven false",
          "declaredProfile": null
        },
        "issuedAt": "2026-01-15T00:00:00.000Z",
        "revocationPointer": {
          "issuer": "Riverside Traders Co-operative",
          "address": "local-noticeboard://Riverside Traders Co-operative"
        },
        "flags": [],
        "seal": {
          "algorithm": "ed25519",
          "signature": "06e3df7af1e9b42411bc9ac983e753c4c4b29379aac22d3b65b29047595d4dd35fba97e521b81f6c30210ef8b1e48634b789fbc3b9604bc5a89ac4acfacdfe02",
          "signedAt": "2026-07-06T04:10:45.787Z"
        }
      }
    }
  },
  {
    "id": "step-2",
    "title": "Verify it",
    "paragraphs": [
      "A verifier runs the two checks the Spec describes, in about a second: is it genuine (does the seal match)? Is it still valid (has it been cancelled)? No phone call to the co-op, no record contents leaving Amina’s device."
    ],
    "card": {
      "type": "check",
      "data": {
        "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
        "check1": {
          "structurallySealed": true,
          "issuerKeyConfirmed": true,
          "issuerKeyConfirmedNote": null,
          "genuine": true
        },
        "check2": {
          "checked": true,
          "status": "valid",
          "addressConfirmed": true
        },
        "checksCompleted": {
          "check1": true,
          "check2": true
        },
        "overall": "valid"
      }
    }
  },
  {
    "id": "step-3",
    "title": "Cancel it — the issuer’s own path",
    "paragraphs": [
      "The co-op later discovers the underlying trade-credit paperwork was forged. It cancels the record it signed, stating a reason, and republishes its own signed cancellation list.",
      "Re-checking the same record: the seal is still genuine — it truly was issued — but the validity check now reads the cancellation. Exactly like a cancelled passport that still looks perfect."
    ],
    "card": {
      "type": "check",
      "data": {
        "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
        "check1": {
          "structurallySealed": true,
          "issuerKeyConfirmed": true,
          "issuerKeyConfirmedNote": null,
          "genuine": true
        },
        "check2": {
          "checked": true,
          "status": "cancelled",
          "reason": "fraud discovered: underlying invoices were forged",
          "cancelledBy": "issuer",
          "disputed": false,
          "disputeReason": null,
          "cancelledAt": "2026-07-06T04:10:45.839Z",
          "addressConfirmed": true
        },
        "checksCompleted": {
          "check1": true,
          "check2": true
        },
        "overall": "cancelled"
      }
    }
  },
  {
    "id": "step-4",
    "title": "Cancel it — the holder’s own path",
    "paragraphs": [
      "A second record: a plain membership-standing fact, zero stake — permitted because it’s a factual attestation, not a credit judgement.",
      "Amina’s phone is stolen. She exercises her right to cancel any record about herself, and submits a request to the co-op.",
      "Checking the record right now, before the co-op acts: it still shows valid. Only once the co-op cooperates and countersigns does her cancellation actually take effect."
    ],
    "gapCallout": {
      "label": "Gap 3",
      "text": "The Spec grants the holder a unilateral right to cancel, but the one list a verifier checks can only be signed by the issuer’s key. So the holder’s right, on its own, changes nothing a verifier sees — it only takes effect if the issuer cooperates. An unreachable or uncooperative issuer would leave this record sitting \"valid\" forever, despite Amina having cancelled it."
    },
    "card": {
      "type": "beforeAfter",
      "before": {
        "label": "Before the co-op acts",
        "data": {
          "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
          "check1": {
            "structurallySealed": true,
            "issuerKeyConfirmed": true,
            "issuerKeyConfirmedNote": null,
            "genuine": true
          },
          "check2": {
            "checked": true,
            "status": "valid",
            "addressConfirmed": true
          },
          "checksCompleted": {
            "check1": true,
            "check2": true
          },
          "overall": "valid"
        }
      },
      "after": {
        "label": "After the co-op honours the request",
        "data": {
          "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
          "check1": {
            "structurallySealed": true,
            "issuerKeyConfirmed": true,
            "issuerKeyConfirmedNote": null,
            "genuine": true
          },
          "check2": {
            "checked": true,
            "status": "cancelled",
            "reason": "phone stolen, withdrawing from circulation as a precaution",
            "cancelledBy": "holder",
            "disputed": false,
            "disputeReason": null,
            "cancelledAt": "2026-07-06T04:10:45.961Z",
            "addressConfirmed": true
          },
          "checksCompleted": {
            "check1": true,
            "check2": true
          },
          "overall": "cancelled"
        }
      }
    }
  },
  {
    "id": "step-5",
    "title": "Dispute a cancellation",
    "paragraphs": [
      "Amina disputes the Step 3 cancellation — she says the invoices were real. The disputed flag now travels permanently with the cancellation, visible to every future verifier. It doesn’t undo the cancellation; it makes both sides of the story visible."
    ],
    "card": {
      "type": "check",
      "data": {
        "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
        "check1": {
          "structurallySealed": true,
          "issuerKeyConfirmed": true,
          "issuerKeyConfirmedNote": null,
          "genuine": true
        },
        "check2": {
          "checked": true,
          "status": "cancelled",
          "reason": "fraud discovered: underlying invoices were forged",
          "cancelledBy": "issuer",
          "disputed": true,
          "disputeReason": "I dispute this: the invoices were genuine, I have the originals.",
          "cancelledAt": "2026-07-06T04:10:45.839Z",
          "addressConfirmed": true
        },
        "checksCompleted": {
          "check1": true,
          "check2": true
        },
        "overall": "cancelled"
      }
    }
  },
  {
    "id": "step-6",
    "title": "Read a bundle into a standing",
    "paragraphs": [
      "Amina assembles her records to show a new lender. One is an 8-year-old default — old enough that the memory rule hides it from the standard view by default. Good history never lapses; bad history lapses after 5–7 years and is hidden, never deleted.",
      "She can still choose to show the lapsed record herself, to tell the fuller story — \"I defaulted in 2018, and here is everything since.\" Notice: no score is produced anywhere. Common Credo carries facts; whoever builds the lending tool decides how to weigh them."
    ],
    "card": {
      "type": "bundleCompare",
      "standard": {
        "generatedAt": "2026-07-06T00:00:00.000Z",
        "entries": [
          {
            "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "trade_credit_honoured",
            "polarity": "positive",
            "issuedAt": "2026-01-15T00:00:00.000Z",
            "ageYears": 0.5,
            "lapsed": false,
            "shownByHolderOverride": false,
            "shown": true,
            "verification": {
              "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "cancelled",
                "reason": "fraud discovered: underlying invoices were forged",
                "cancelledBy": "issuer",
                "disputed": true,
                "disputeReason": "I dispute this: the invoices were genuine, I have the originals.",
                "cancelledAt": "2026-07-06T04:10:45.839Z",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "cancelled"
            }
          },
          {
            "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "membership_good_standing",
            "polarity": "neutral",
            "issuedAt": "2025-06-01T00:00:00.000Z",
            "ageYears": 1.1,
            "lapsed": false,
            "shownByHolderOverride": false,
            "shown": true,
            "verification": {
              "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "cancelled",
                "reason": "phone stolen, withdrawing from circulation as a precaution",
                "cancelledBy": "holder",
                "disputed": false,
                "disputeReason": null,
                "cancelledAt": "2026-07-06T04:10:45.961Z",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "cancelled"
            }
          },
          {
            "recordId": "dd235e9ed7634b07ffa22a1452ca07353433635988d1c1d3470bacd8c3c964ce",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "loan_defaulted",
            "polarity": "negative",
            "issuedAt": "2018-03-01T00:00:00.000Z",
            "ageYears": 8.3,
            "lapsed": true,
            "shownByHolderOverride": false,
            "shown": false,
            "verification": {
              "recordId": "dd235e9ed7634b07ffa22a1452ca07353433635988d1c1d3470bacd8c3c964ce",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "valid",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "valid"
            }
          }
        ],
        "summary": {
          "totalRecordsInWallet": 3,
          "shownInStandard": 2,
          "hiddenAsLapsed": 1,
          "positive": 1,
          "negative": 0,
          "neutral": 1,
          "cancelled": 2,
          "unverifiable": 0
        }
      },
      "forced": {
        "generatedAt": "2026-07-06T00:00:00.000Z",
        "entries": [
          {
            "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "trade_credit_honoured",
            "polarity": "positive",
            "issuedAt": "2026-01-15T00:00:00.000Z",
            "ageYears": 0.5,
            "lapsed": false,
            "shownByHolderOverride": false,
            "shown": true,
            "verification": {
              "recordId": "7aa2211ad1e0b792d84ca02d8e555451223f650dbc3e13bb255e0bc1583f28ac",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "cancelled",
                "reason": "fraud discovered: underlying invoices were forged",
                "cancelledBy": "issuer",
                "disputed": true,
                "disputeReason": "I dispute this: the invoices were genuine, I have the originals.",
                "cancelledAt": "2026-07-06T04:10:45.839Z",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "cancelled"
            }
          },
          {
            "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "membership_good_standing",
            "polarity": "neutral",
            "issuedAt": "2025-06-01T00:00:00.000Z",
            "ageYears": 1.1,
            "lapsed": false,
            "shownByHolderOverride": false,
            "shown": true,
            "verification": {
              "recordId": "591b2eb4c85f5938ab3df3cfc7f451874c84768b82be0db8ea59956b40543f95",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "cancelled",
                "reason": "phone stolen, withdrawing from circulation as a precaution",
                "cancelledBy": "holder",
                "disputed": false,
                "disputeReason": null,
                "cancelledAt": "2026-07-06T04:10:45.961Z",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "cancelled"
            }
          },
          {
            "recordId": "dd235e9ed7634b07ffa22a1452ca07353433635988d1c1d3470bacd8c3c964ce",
            "issuer": "Riverside Traders Co-operative",
            "claimType": "loan_defaulted",
            "polarity": "negative",
            "issuedAt": "2018-03-01T00:00:00.000Z",
            "ageYears": 8.3,
            "lapsed": true,
            "shownByHolderOverride": true,
            "shown": true,
            "verification": {
              "recordId": "dd235e9ed7634b07ffa22a1452ca07353433635988d1c1d3470bacd8c3c964ce",
              "check1": {
                "structurallySealed": true,
                "issuerKeyConfirmed": true,
                "issuerKeyConfirmedNote": null,
                "genuine": true
              },
              "check2": {
                "checked": true,
                "status": "valid",
                "addressConfirmed": true
              },
              "checksCompleted": {
                "check1": true,
                "check2": true
              },
              "overall": "valid"
            }
          }
        ],
        "summary": {
          "totalRecordsInWallet": 3,
          "shownInStandard": 3,
          "hiddenAsLapsed": 0,
          "positive": 1,
          "negative": 1,
          "neutral": 1,
          "cancelled": 2,
          "unverifiable": 0
        }
      }
    }
  },
  {
    "id": "step-7",
    "title": "A dead issuer (degraded check)",
    "paragraphs": [
      "One more record, from a trade union that never published a noticeboard — it has since gone dark. The Spec’s own honest edge: this is not rejected and not accepted. It is unverifiable, and priced accordingly by whoever is reading it."
    ],
    "card": {
      "type": "check",
      "data": {
        "recordId": "87622bf8cb6ecf76135bdb5f50de4122e17f3f954ded8845638c14226a66ba20",
        "check1": {
          "structurallySealed": true,
          "issuerKeyConfirmed": true,
          "issuerKeyConfirmedNote": null,
          "genuine": true
        },
        "check2": {
          "checked": false,
          "status": "unverifiable",
          "reason": "dead issuer: no cancellation list found at all",
          "addressConfirmed": true
        },
        "checksCompleted": {
          "check1": true,
          "check2": true
        },
        "overall": "unverifiable"
      }
    }
  }
];
