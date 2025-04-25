const {
    ensureSchemaUpdated,
    createAppointment,
    getAppointmentsByPatient,
    getDoctorAppointmentsActive,
    getDoctorAppointmentsPending,
    updateAppointmentStatus,
  } = require('../helper-functions');
  
describe('Helper Functions for Appointments', () => {
    let mockConnection;
  
    beforeEach(() => {
      mockConnection = { query: jest.fn() };
    });
  
    test('ensureSchemaUpdated resolves false if already updated', async () => {
        // First call: createSettingsTable -> no error
        // Second call: checkSql -> returns [{ value: 'true' }]
        mockConnection.query
            .mockImplementationOnce((sql, cb) => cb(null))
            .mockImplementationOnce((sql, cb) => cb(null, [{ value: 'true' }]));
    
        const result = await ensureSchemaUpdated(mockConnection);
        expect(result).toBe(false);
        expect(mockConnection.query).toHaveBeenCalledTimes(2);
    });
  
    test('ensureSchemaUpdated resolves true if update performed', async () => {
        // createSettingsTable -> no error
        // checkSql -> returns []
        // alterSql -> no error
        // insertSql -> no error
        mockConnection.query
            .mockImplementationOnce((sql, cb) => cb(null))
            .mockImplementationOnce((sql, cb) => cb(null, []))
            .mockImplementationOnce((sql, cb) => cb(null))
            .mockImplementationOnce((sql, cb) => cb(null));
    
        const result = await ensureSchemaUpdated(mockConnection);
        expect(result).toBe(true);
        expect(mockConnection.query).toHaveBeenCalledTimes(4);
    });
  
    test('createAppointment resolves with insertId', async () => {
        mockConnection.query.mockImplementation((sql, values, cb) => cb(null, { insertId: 42 }));
        const id = await createAppointment({ connection: mockConnection, patientID: 1, apptDate: '2025-05-01', apptTime: '10:00', reason: 'Checkup' });
        expect(id).toBe(42);
        expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [1, null, '2025-05-01', '10:00', 'Checkup', 'Pending'], expect.any(Function));
    });
  
    test('getAppointmentsByPatient resolves rows', async () => {
        mockConnection.query.mockImplementation((sql, params, cb) => cb(null, [{ ApptID: 1 }]));
        const rows = await getAppointmentsByPatient({ connection: mockConnection, patientID: 1 });
        expect(rows).toEqual([{ ApptID: 1 }]);
    });
  
    test('getDoctorAppointmentsActive resolves rows', async () => {
        mockConnection.query.mockImplementation((sql, params, cb) => cb(null, [{ ApptID: 2 }]));
        const rows = await getDoctorAppointmentsActive({ connection: mockConnection, doctorID: 2 });
        expect(rows).toEqual([{ ApptID: 2 }]);
    });
  
    test('getDoctorAppointmentsPending resolves rows', async () => {
        mockConnection.query.mockImplementation((sql, cb) => cb(null, [{ ApptID: 3 }]));
        const rows = await getDoctorAppointmentsPending({ connection: mockConnection });
        expect(rows).toEqual([{ ApptID: 3 }]);
    });
  
    test('updateAppointmentStatus resolves when updated', async () => {
        mockConnection.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }));
        await expect(updateAppointmentStatus({ connection: mockConnection, apptID: 5, doctorID: 2, status: 'Approved' })).resolves.toBeUndefined();
    });
  
    test('updateAppointmentStatus rejects with NOT_FOUND error', async () => {
        mockConnection.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 0 }));
        await expect(updateAppointmentStatus({ connection: mockConnection, apptID: 5, doctorID: 2, status: 'Approved' })).rejects.toThrow('NOT_FOUND');
    });
});
  