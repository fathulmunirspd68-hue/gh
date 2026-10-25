import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SCHOOL_PROFILE,
  validateSchoolProfileInput,
  normalizeStoredSchoolProfile,
  updateStudentPhotoInList,
  countStudentsWithPhotos,
  createSchoolSlug,
} from './schoolSettings.ts';
import type { Student } from '../types/index.ts';

test('validateSchoolProfileInput: rejects empty required school name, npsn, or address', () => {
  const emptyName = validateSchoolProfileInput({
    name: '   ',
    npsn: '20216000',
    address: 'Kec. Terisi',
  });
  assert.equal(emptyName.valid, false);
  assert.match(emptyName.error || '', /Nama sekolah wajib diisi/);

  const emptyNpsn = validateSchoolProfileInput({
    name: 'SDN 1 Indramayu',
    npsn: '',
    address: 'Kab. Indramayu',
  });
  assert.equal(emptyNpsn.valid, false);
  assert.match(emptyNpsn.error || '', /NPSN/);

  const emptyAddress = validateSchoolProfileInput({
    name: 'SDN 1 Indramayu',
    npsn: '20216001',
    address: '  ',
  });
  assert.equal(emptyAddress.valid, false);
  assert.match(emptyAddress.error || '', /Wilayah singkat/);
});

test('validateSchoolProfileInput: trims and returns valid sanitized SchoolProfile', () => {
  const res = validateSchoolProfileInput({
    name: '  SDN 1 UNGGULAN INDRAMAYU  ',
    npsn: ' 20299881 ',
    address: ' Kec. Sindang, Kab. Indramayu ',
    headmasterName: ' Hj. Siti Aminah, M.Pd. ',
    logoUrl: 'data:image/png;base64,iVBORw0KGgo=',
  });

  assert.equal(res.valid, true);
  assert.ok(res.sanitized);
  assert.equal(res.sanitized.name, 'SDN 1 UNGGULAN INDRAMAYU');
  assert.equal(res.sanitized.npsn, '20299881');
  assert.equal(res.sanitized.address, 'Kec. Sindang, Kab. Indramayu');
  assert.equal(res.sanitized.headmasterName, 'Hj. Siti Aminah, M.Pd.');
  assert.equal(res.sanitized.logoUrl, 'data:image/png;base64,iVBORw0KGgo=');
});

test('normalizeStoredSchoolProfile: falls back safely on null or partial objects', () => {
  const fromNull = normalizeStoredSchoolProfile(null);
  assert.deepEqual(fromNull, DEFAULT_SCHOOL_PROFILE);

  const partial = normalizeStoredSchoolProfile({
    name: 'SMPN 2 TERISI',
    logoUrl: 'data:image/png;base64,abc',
  });
  assert.equal(partial.name, 'SMPN 2 TERISI');
  assert.equal(partial.npsn, DEFAULT_SCHOOL_PROFILE.npsn);
  assert.equal(partial.logoUrl, 'data:image/png;base64,abc');
});

test('updateStudentPhotoInList & countStudentsWithPhotos: updates and clears student photo cleanly', () => {
  const students: Student[] = [
    { id: '1', nisn: '1001', name: 'Ahmad', gender: 'Laki-laki', class: 'Kelas 1' },
    { id: '2', nisn: '1002', name: 'Anisa', gender: 'Perempuan', class: 'Kelas 1' },
  ];

  assert.equal(countStudentsWithPhotos(students), 0);

  const withPhoto = updateStudentPhotoInList(students, '1', 'data:image/jpeg;base64,xyz');
  assert.equal(countStudentsWithPhotos(withPhoto), 1);
  assert.equal(withPhoto[0].photoUrl, 'data:image/jpeg;base64,xyz');
  assert.equal(withPhoto[1].photoUrl, undefined);

  const cleared = updateStudentPhotoInList(withPhoto, '1', '');
  assert.equal(countStudentsWithPhotos(cleared), 0);
  assert.equal(cleared[0].photoUrl, undefined);
});

test('createSchoolSlug: generates clean filename slug', () => {
  assert.equal(createSchoolSlug('UPTD SDN 2 RAJASINGA'), 'UPTD_SDN_2_RAJASINGA');
  assert.equal(createSchoolSlug('  SDN 1 / Indramayu! '), 'SDN_1_Indramayu');
  assert.equal(createSchoolSlug('   '), 'Sekolah');
});
