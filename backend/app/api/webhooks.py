"""Stripe webhook handler (Phase 3).

Processes payment events to update session statuses.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Header, HTTPException, Request, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.mentor import MentorSession, SessionStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post(
    "/stripe",
    status_code=status.HTTP_200_OK,
    summary="Handle Stripe webhook events",
)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
) -> dict:
    """Process incoming Stripe webhook events.

    Currently handles:
    - payment_intent.succeeded: Confirms the associated mentoring session.

    In production, verify the webhook signature using the Stripe SDK.
    For this mock, we parse the raw JSON body directly.
    """
    try:
        body = await request.body()
        payload = json.loads(body)
    except (json.JSONDecodeError, Exception) as exc:
        logger.error("Failed to parse Stripe webhook payload: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )

    # In production, verify signature:
    # try:
    #     event = stripe.Webhook.construct_event(
    #         body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
    #     )
    # except stripe.error.SignatureVerificationError:
    #     raise HTTPException(status_code=400, detail="Invalid signature")

    event_type: str = payload.get("type", "")
    data: dict = payload.get("data", {}).get("object", {})

    if event_type == "payment_intent.succeeded":
        payment_intent_id = data.get("id", "")
        if payment_intent_id:
            result = await db.execute(
                select(MentorSession).where(
                    MentorSession.stripe_payment_intent_id == payment_intent_id
                )
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = SessionStatus.confirmed
                await db.flush()
                logger.info(
                    "Session %d confirmed via payment_intent %s",
                    session.id,
                    payment_intent_id,
                )
                return {"status": "success", "session_id": session.id}

        logger.warning(
            "payment_intent.succeeded received but no matching session found for %s",
            data.get("id"),
        )
        return {"status": "no_matching_session"}

    elif event_type == "payment_intent.payment_failed":
        payment_intent_id = data.get("id", "")
        if payment_intent_id:
            result = await db.execute(
                select(MentorSession).where(
                    MentorSession.stripe_payment_intent_id == payment_intent_id
                )
            )
            session = result.scalar_one_or_none()
            if session:
                session.status = SessionStatus.cancelled
                await db.flush()
                logger.info(
                    "Session %d cancelled due to payment failure for %s",
                    session.id,
                    payment_intent_id,
                )
                return {"status": "session_cancelled", "session_id": session.id}

        return {"status": "no_matching_session"}

    else:
        logger.info("Unhandled Stripe event type: %s", event_type)
        return {"status": "ignored", "event_type": event_type}
