// migrations/001_initial_schema.js

const { Knex } = require('knex');

/**
 * Initial database migration
 * Creates all base tables and relationships
 */

exports.up = async function(knex) {
  // Create extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  
  // Create custom types
  await knex.raw(`
    CREATE TYPE user_role_enum AS ENUM (
      'farmer', 'document_reviewer', 'auditor', 'manager', 
      'finance', 'admin', 'super_admin', 'customer_service', 'cms'
    )
  `);
  
  await knex.raw(`
    CREATE TYPE application_status_enum AS ENUM (
      'draft', 'pending_initial_payment', 'pending_review', 'review_passed',
      'resubmission_required', 'pending_audit_payment', 'pending_audit_visit',
      'audit_scheduled', 'audit_completed', 'pending_final_approval',
      'pending_certificate_payment', 'approved', 'rejected', 'cancelled',
      'expired', 'suspended', 'revoked'
    )
  `);
  
  await knex.raw(`
    CREATE TYPE payment_type_enum AS ENUM (
      'initial_review', 'audit_visit', 'certificate_issuance', 'renewal', 'resubmission'
    )
  `);
  
  await knex.raw(`
    CREATE TYPE payment_status_enum AS ENUM (
      'pending', 'processing', 'confirmed', 'failed', 'refunded', 'cancelled'
    )
  `);
  
  await knex.raw(`
    CREATE TYPE product_type_enum AS ENUM (
      'cannabis', 'hemp', 'herb', 'medicinal_plant'
    )
  `);
  
  // Create tables
  await knex.schema.createTable('user_profiles', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.text('encrypted_email');
    table.string('phone', 20);
    table.text('encrypted_phone');
    table.string('national_id', 13);
    table.text('encrypted_national_id');
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.specificType('role', 'user_role_enum').notNullable().defaultTo('farmer');
    table.boolean('has_completed_elearning').defaultTo(false);
    table.decimal('elearning_score', 5, 2);
    table.timestamp('elearning_completed_at');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.boolean('two_factor_enabled').defaultTo(false);
    table.text('two_factor_secret');
    table.timestamp('last_login_at');
    table.integer('login_count').defaultTo(0);
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('account_locked_until');
    table.text('password_hash').notNullable();
    table.timestamp('password_changed_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index('email');
    table.index('role');
  });
  
  await knex.schema.createTable('products', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('product_code', 20).unique().notNullable();
    table.string('product_name_th', 200).notNullable();
    table.string('product_name_en', 200);
    table.specificType('product_type', 'product_type_enum').notNullable();
    table.string('scientific_name', 200);
    table.string('family_name', 100);
    table.decimal('thc_limit', 5, 2);
    table.decimal('cbd_range_min', 5, 2);
    table.decimal('cbd_range_max', 5, 2);
    table.specificType('target_market', 'text[]');
    table.specificType('export_countries', 'text[]');
    table.specificType('common_uses', 'text[]');
    table.jsonb('medicinal_properties');
    table.integer('cultivation_period_days');
    table.string('ideal_climate', 100);
    table.decimal('ideal_soil_ph_min', 3, 1);
    table.decimal('ideal_soil_ph_max', 3, 1);
    table.string('water_requirement', 50);
    table.boolean('is_controlled_substance').defaultTo(false);
    table.boolean('requires_special_license').defaultTo(false);
    table.text('regulatory_notes');
    table.string('status', 20).defaultTo('active');
    table.timestamps(true, true);
  });
  
  await knex.schema.createTable('gacp_applications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('application_code', 30).unique().notNullable();
    table.uuid('user_id').references('id').inTable('user_profiles').onDelete('RESTRICT');
    table.uuid('product_id').references('id').inTable('products').onDelete('RESTRICT');
    table.specificType('status', 'application_status_enum').notNullable().defaultTo('draft');
    table.jsonb('form_data').notNullable();
    table.decimal('completeness_score', 5, 2);
    table.decimal('document_score', 5, 2);
    table.decimal('compliance_score', 5, 2);
    table.timestamp('submitted_at');
    table.timestamp('reviewed_at');
    table.timestamp('audit_scheduled_at');
    table.timestamp('audit_completed_at');
    table.timestamp('approved_at');
    table.timestamp('rejected_at');
    table.timestamp('expires_at');
    table.uuid('reviewer_id').references('id').inTable('user_profiles');
    table.uuid('auditor_id').references('id').inTable('user_profiles');
    table.uuid('approved_by').references('id').inTable('user_profiles');
    table.text('reviewer_comments');
    table.text('auditor_comments');
    table.text('approval_comments');
    table.text('rejection_reason');
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.string('source', 50);
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('submitted_at');
    table.index('application_code');
  });
  
  await knex.schema.createTable('application_status_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').references('id').inTable('gacp_applications').onDelete('CASCADE');
    table.specificType('from_status', 'application_status_enum');
    table.specificType('to_status', 'application_status_enum').notNullable();
    table.uuid('changed_by').references('id').inTable('user_profiles');
    table.text('reason');
    table.jsonb('metadata');
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    
    table.index('application_id');
    table.index('changed_at');
  });
  
  await knex.schema.createTable('payments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('payment_code', 30).unique().notNullable();
    table.uuid('application_id').references('id').inTable('gacp_applications').onDelete('RESTRICT');
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 3).defaultTo('THB');
    table.specificType('payment_type', 'payment_type_enum').notNullable();
    table.specificType('status', 'payment_status_enum').defaultTo('pending');
    table.string('invoice_number', 50);
    table.text('invoice_url');
    table.timestamp('invoice_generated_at');
    table.string('payment_method', 50);
    table.string('payment_gateway', 50);
    table.string('transaction_id', 100);
    table.string('reference_number', 100);
    table.string('receipt_number', 50);
    table.text('receipt_url');
    table.timestamp('receipt_generated_at');
    table.date('due_date');
    table.timestamp('paid_at');
    table.timestamp('confirmed_at');
    table.timestamp('refunded_at');
    table.decimal('refund_amount', 12, 2);
    table.text('refund_reason');
    table.string('refund_transaction_id', 100);
    table.string('omise_charge_id', 100);
    table.string('omise_customer_id', 100);
    table.jsonb('payment_metadata');
    table.timestamps(true, true);
    
    table.index('application_id');
    table.index('status');
    table.index('payment_type');
  });
  
  return knex;
};

exports.down = async function(knex) {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('application_status_history');
  await knex.schema.dropTableIfExists('gacp_applications');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('user_profiles');
  
  // Drop types
  await knex.raw('DROP TYPE IF EXISTS user_role_enum CASCADE');
  await knex.raw('DROP TYPE IF EXISTS application_status_enum CASCADE');
  await knex.raw('DROP TYPE IF EXISTS payment_type_enum CASCADE');
  await knex.raw('DROP TYPE IF EXISTS payment_status_enum CASCADE');
  await knex.raw('DROP TYPE IF EXISTS product_type_enum CASCADE');
  
  return knex;
};