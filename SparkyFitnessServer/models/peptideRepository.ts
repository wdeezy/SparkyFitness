import { getClient } from '../db/poolManager.js';

// ---- Peptides ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPeptide(userId: any, data: any) {
  const { name, half_life_hours, default_dose, dose_unit, color, notes } = data;
  const client = await getClient(userId);
  try {
    const result = await client.query(
      `INSERT INTO peptides (user_id, name, half_life_hours, default_dose, dose_unit, color, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        name,
        half_life_hours,
        default_dose ?? null,
        dose_unit || 'mg',
        color ?? null,
        notes ?? null,
      ]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPeptidesByUserId(userId: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      'SELECT * FROM peptides WHERE user_id = $1 ORDER BY is_active DESC, name ASC',
      [userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPeptideById(id: any, userId: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      'SELECT * FROM peptides WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updatePeptide(id: any, userId: any, data: any) {
  const {
    name,
    half_life_hours,
    default_dose,
    dose_unit,
    color,
    notes,
    is_active,
  } = data;
  const client = await getClient(userId);
  try {
    const result = await client.query(
      `UPDATE peptides SET
        name = COALESCE($1, name),
        half_life_hours = COALESCE($2, half_life_hours),
        default_dose = COALESCE($3, default_dose),
        dose_unit = COALESCE($4, dose_unit),
        color = COALESCE($5, color),
        notes = COALESCE($6, notes),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9 RETURNING *`,
      [
        name ?? null,
        half_life_hours ?? null,
        default_dose ?? null,
        dose_unit ?? null,
        color ?? null,
        notes ?? null,
        typeof is_active === 'boolean' ? is_active : null,
        id,
        userId,
      ]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deletePeptide(id: any, userId: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      'DELETE FROM peptides WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return { deleted: (result.rowCount ?? 0) > 0 };
  } finally {
    client.release();
  }
}

// ---- Injections ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createInjection(userId: any, data: any) {
  const { peptide_id, dose, dose_unit, injection_site, injected_at, notes } =
    data;
  const client = await getClient(userId);
  try {
    const result = await client.query(
      `INSERT INTO peptide_injections
        (user_id, peptide_id, dose, dose_unit, injection_site, injected_at, notes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7) RETURNING *`,
      [
        userId,
        peptide_id,
        dose,
        dose_unit || 'mg',
        injection_site ?? null,
        injected_at ?? null,
        notes ?? null,
      ]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInjectionsByPeptide(userId: any, peptideId: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      `SELECT * FROM peptide_injections
       WHERE user_id = $1 AND peptide_id = $2
       ORDER BY injected_at DESC`,
      [userId, peptideId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInjectionsSince(userId: any, peptideId: any, sinceIso: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      `SELECT dose, injected_at FROM peptide_injections
       WHERE user_id = $1 AND peptide_id = $2 AND injected_at >= $3
       ORDER BY injected_at ASC`,
      [userId, peptideId, sinceIso]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteInjection(id: any, userId: any) {
  const client = await getClient(userId);
  try {
    const result = await client.query(
      'DELETE FROM peptide_injections WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return { deleted: (result.rowCount ?? 0) > 0 };
  } finally {
    client.release();
  }
}

export {
  createPeptide,
  getPeptidesByUserId,
  getPeptideById,
  updatePeptide,
  deletePeptide,
  createInjection,
  getInjectionsByPeptide,
  getInjectionsSince,
  deleteInjection,
};

export default {
  createPeptide,
  getPeptidesByUserId,
  getPeptideById,
  updatePeptide,
  deletePeptide,
  createInjection,
  getInjectionsByPeptide,
  getInjectionsSince,
  deleteInjection,
};
