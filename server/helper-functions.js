const ensureSchemaUpdated = (connection) => {
    return new Promise((resolve, reject) => {
      const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS settings (
            name VARCHAR(100) PRIMARY KEY,
            value VARCHAR(255)
        );`; // this looks cursed, but JS is just... JS
        connection.query(createSettingsTable, (err) => {
        if (err) return reject(err);
        const checkSql = `SELECT value FROM settings WHERE name = 'appointments_enum_updated'`;
        connection.query(checkSql, (err, results) => {
            if (err) return reject(err);
            if (results.length > 0 && results[0].value === 'true') {
                return resolve(false);
            }
            const alterSql = `
                ALTER TABLE appointments
                MODIFY COLUMN Status ENUM('Pending','Approved','Rejected','Finished') NOT NULL DEFAULT 'Pending';
            `;
            connection.query(alterSql, (alterErr) => {
                if (alterErr) return reject(alterErr);
                const insertSql = `
                    INSERT INTO settings (name,value)
                    VALUES ('appointments_enum_updated','true')
                    ON DUPLICATE KEY UPDATE value='true';
                `;
                connection.query(insertSql, (insertErr) => {
                    if (insertErr) return reject(insertErr);
                        resolve(true);
                    });
                });
            });
        });
    });
};
  
const createAppointment = ({ connection, patientID, apptDate, apptTime, reason }) => {
    const status = 'Pending';
    const doctorID = null;
    const sql = `
        INSERT INTO appointments
            (PatientID, DoctorID, ApptDate, ApptTime, Reason, Status, CreatedAt, UpdatedAt, NurseID)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
    `;
    const values = [patientID, doctorID, apptDate, apptTime, reason, status];
    return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};
  
const getAppointmentsByPatient = ({ connection, patientID }) => {
    const sql = `SELECT * FROM appointments WHERE PatientID = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [patientID], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};
  
const getDoctorAppointmentsActive = ({ connection, doctorID }) => {
    const sql = `
        SELECT * FROM appointments
        WHERE DoctorID = ?
            AND Status <> 'Pending'
            AND Status <> 'Finished'
            AND Status <> 'Rejected'
    `;
    return new Promise((resolve, reject) => {
        connection.query(sql, [doctorID], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};
  
const getDoctorAppointmentsPending = ({ connection }) => {
    const sql = `SELECT * FROM appointments WHERE Status = 'Pending'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};
  
const updateAppointmentStatus = ({ connection, apptID, doctorID, status }) => {
    const sql = `
        UPDATE appointments
        SET Status = ?, UpdatedAt = NOW(), DoctorID = ?
        WHERE ApptID = ?
    `;
    return new Promise((resolve, reject) => {
        connection.query(sql, [status, doctorID, apptID], (err, result) => {
            if (err) return reject(err);
            if (result.affectedRows === 0) return reject(new Error('NOT_FOUND'));
            resolve();
        });
    });
};
  
module.exports = {
    ensureSchemaUpdated,
    createAppointment,
    getAppointmentsByPatient,
    getDoctorAppointmentsActive,
    getDoctorAppointmentsPending,
    updateAppointmentStatus,
};
  
