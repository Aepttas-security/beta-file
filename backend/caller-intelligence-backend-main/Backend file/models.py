# models.py - Precisely Synced with CSV Data & SQL
from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger, ForeignKey, UUID, Text
from sqlalchemy.sql import func
import uuid
from database import Base

class MetadataBase:
    created_by = Column(String(100), server_default='CURRENT_USER', nullable=False)
    created_date = Column(DateTime, server_default=func.now(), nullable=False)
    last_updated_by = Column(String(100), server_default='CURRENT_USER', nullable=False)
    last_updated_date = Column(DateTime, server_default=func.now(), nullable=False)
    last_dml_by = Column(String(100), server_default='CURRENT_USER', nullable=False)
    last_dml_date = Column(DateTime, server_default=func.now(), nullable=False)
    last_ddl_by = Column(String(100), server_default='CURRENT_USER', nullable=False)
    last_ddl_date = Column(DateTime, server_default=func.now(), nullable=False)
    program_id = Column(BigInteger)

class AptUsersB(Base, MetadataBase):
    __tablename__ = 'apt_users_b'
    __table_args__ = {'schema': 'apt'}
    user_id = Column(BigInteger, primary_key=True, index=True)
    user_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    username = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)

class AptCallersB(Base, MetadataBase):
    __tablename__ = 'apt_callers_b'
    __table_args__ = {'schema': 'apt'}
    caller_id = Column(BigInteger, primary_key=True, index=True)
    caller_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True)
    caller_name = Column(String(200))
    is_spam_reported = Column(Boolean, default=False, nullable=False)
    risk_level_id = Column(BigInteger)

class AptCallsB(Base, MetadataBase):
    __tablename__ = 'apt_calls_b'
    __table_args__ = {'schema': 'apt'}
    call_id = Column(BigInteger, primary_key=True, index=True)
    call_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    user_id = Column(BigInteger, ForeignKey('apt.apt_users_b.user_id'), nullable=False)
    caller_id = Column(BigInteger, ForeignKey('apt.apt_callers_b.caller_id'), nullable=False)
    phone_number = Column(String(20), nullable=False)
    call_type = Column(String(20), nullable=False)
    call_duration_seconds = Column(Integer, default=0, nullable=False)
    call_timestamp = Column(DateTime, nullable=False)
    status_id = Column(BigInteger)

class AptBlockedNumbersB(Base, MetadataBase):
    __tablename__ = 'apt_blocked_numbers_b'
    __table_args__ = {'schema': 'apt'}
    blocked_number_id = Column(BigInteger, primary_key=True, index=True)
    blocked_number_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    user_id = Column(BigInteger, ForeignKey('apt.apt_users_b.user_id'), nullable=False)
    caller_id = Column(BigInteger, ForeignKey('apt.apt_callers_b.caller_id'), nullable=False)
    phone_number = Column(String(20), nullable=False)
    blocked_date = Column(DateTime, server_default=func.now(), nullable=False)
    reason = Column(String(500))

class AptReportsB(Base, MetadataBase):
    __tablename__ = 'apt_reports_b'
    __table_args__ = {'schema': 'apt'}
    report_id = Column(BigInteger, primary_key=True, index=True)
    report_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    user_id = Column(BigInteger, ForeignKey('apt.apt_users_b.user_id'), nullable=False)
    caller_id = Column(BigInteger, ForeignKey('apt.apt_callers_b.caller_id'), nullable=False)
    call_id = Column(BigInteger, ForeignKey('apt.apt_calls_b.call_id'))
    phone_number = Column(String(20), nullable=False)
    report_reason = Column(String(500), nullable=False)
    status_id = Column(BigInteger)

class AptAlertsB(Base, MetadataBase):
    __tablename__ = 'apt_alerts_b'
    __table_args__ = {'schema': 'apt'}
    alert_id = Column(BigInteger, primary_key=True, index=True)
    alert_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    user_id = Column(BigInteger, ForeignKey('apt.apt_users_b.user_id'), nullable=False)
    caller_id = Column(BigInteger, ForeignKey('apt.apt_callers_b.caller_id'))
    call_id = Column(BigInteger, ForeignKey('apt.apt_calls_b.call_id'))
    phone_number = Column(String(20))
    severity_id = Column(BigInteger, nullable=False)
    alert_message = Column(String(1000), nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)

class AptCallSettingsB(Base, MetadataBase):
    __tablename__ = 'apt_call_settings_b'
    __table_args__ = {'schema': 'apt'}
    call_setting_id = Column(BigInteger, primary_key=True, index=True)
    call_setting_uuid = Column(UUID, default=uuid.uuid4, nullable=False)
    user_id = Column(BigInteger, ForeignKey('apt.apt_users_b.user_id'), nullable=False)
    auto_block_spam = Column(Boolean, default=True, nullable=False)
    block_unknown_numbers = Column(Boolean, default=False, nullable=False)
    notification_type_id = Column(BigInteger)
